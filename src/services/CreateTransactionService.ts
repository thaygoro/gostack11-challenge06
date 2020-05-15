import { getCustomRepository, getRepository } from 'typeorm';

import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    // TODO
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);

    if (type === 'outcome') {
      const balance = await transactionRepository.getBalance();

      if (balance.total - value < 0) {
        throw new AppError(
          'Invalid balance, outcome bigger than total income',
          400,
        );
      }
    }

    let categoryToFind = await categoryRepository.findOne({
      where: { title: category },
    });

    if (!categoryToFind) {
      categoryToFind = categoryRepository.create({
        title: category,
      });
      await categoryRepository.save(categoryToFind);
    }

    const transaction = transactionRepository.create({
      title,
      value,
      type,
      category_id: categoryToFind.id,
    });

    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
