import CreditAccount from "../models/CreditAccount.js";
import CreditAccountItem from "../models/CreditAccountItem.js";
import Sale from "../models/Sale.js";
import SaleItem from "../models/SaleItem.js";
import Product from "../models/Product.js";
import { AppError } from "../errors/appError.js";
import { sequelize } from "../config/database.js";

export const getAll = async () => {
  const accounts = await CreditAccount.findAll({
    include: [
      {
        model: CreditAccountItem,
        where: { archived: false },
        required: false,
        attributes: ["id"],
      },
    ],
    order: [["name", "ASC"]],
  });

  return accounts.map((account) => {
    const data = account.toJSON();
    data.activeItemsCount = data.CreditAccountItems?.length || 0;
    delete data.CreditAccountItems;
    return data;
  });
};

export const getById = async (id) => {
  const account = await CreditAccount.findByPk(id, {
    include: [
      {
        model: CreditAccountItem,
        where: { archived: false },
        required: false,
        order: [["date", "DESC"]],
      },
    ],
  });
  if (!account) throw new AppError("Credit account not found", 404);
  return account;
};

export const create = async (data) => {
  return await CreditAccount.create(data);
};

export const getClosure = async (id) => {
  const account = await CreditAccount.findByPk(id, {
    include: [
      {
        model: CreditAccountItem,
        where: { archived: false },
        required: false,
        order: [["date", "DESC"]],
        include: [
          {
            model: Sale,
            include: [
              {
                model: SaleItem,
                include: [{ model: Product, attributes: ["id", "name", "saleType"] }],
              },
            ],
          },
        ],
      },
    ],
  });
  if (!account) throw new AppError("Credit account not found", 404);

  const items = account.CreditAccountItems || [];
  const totalCharges = items
    .filter((item) => item.type !== "PAGO")
    .reduce((sum, item) => sum + parseFloat(item.amount), 0);
  const totalPayments = items
    .filter((item) => item.type === "PAGO")
    .reduce((sum, item) => sum + Math.abs(parseFloat(item.amount)), 0);

  return {
    id: account.id,
    name: account.name,
    balance: account.balance,
    totalCharges,
    totalPayments,
    activeItemsCount: items.length,
    items,
  };
};

export const registerPayment = async (id, data) => {
  const account = await CreditAccount.findByPk(id);
  if (!account) throw new AppError("Credit account not found", 404);

  const balance = parseFloat(account.balance);
  const payment = parseFloat(data.amount);

  if (balance <= 0) {
    throw new AppError("Account has no pending balance", 400);
  }

  if (!Number.isFinite(payment) || payment <= 0) {
    throw new AppError("Payment amount must be positive", 400);
  }

  if (payment > balance) {
    throw new AppError("Payment amount cannot exceed the pending balance", 400);
  }

  const transaction = await sequelize.transaction();
  try {
    await CreditAccountItem.create(
      {
        creditAccountId: id,
        saleId: null,
        amount: -payment,
        date: new Date(),
        archived: false,
        type: "PAGO",
        paymentMethod: data.paymentMethod,
      },
      { transaction }
    );

    await account.decrement("balance", { by: payment, transaction });

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }

  return await getClosure(id);
};

export const settle = async (id) => {
  const account = await CreditAccount.findByPk(id);
  if (!account) throw new AppError("Credit account not found", 404);

  const activeItemsCount = await CreditAccountItem.count({
    where: { creditAccountId: id, archived: false },
  });

  if (activeItemsCount === 0) {
    throw new AppError("Account has no pending movements", 400);
  }

  const transaction = await sequelize.transaction();
  try {
    // Archive all active items
    await CreditAccountItem.update(
      { archived: true, settledAt: new Date() },
      {
        where: { creditAccountId: id, archived: false },
        transaction,
      }
    );

    // Reset balance to 0
    await account.update({ balance: 0 }, { transaction });

    await transaction.commit();

    return await CreditAccount.findByPk(id, {
      include: [
        {
          model: CreditAccountItem,
          where: { archived: false },
          required: false,
        },
      ],
    });
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};
