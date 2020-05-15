import csvParse from 'csv-parse';
import fs from 'fs';

import { getCustomRepository, getRepository } from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const readCSVStream = fs.createReadStream(filePath);
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const lines: any[] = [];

    parseCSV.on('data', async line => {
      lines.push(line);
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    const transactationsImported: Transaction[] = [];
    const categoriesArray: Category[] = [];

    for (let i = 0; i < lines.length; i++) {
      let categoryToFind = await categoriesRepository.findOne({
        where: { title: lines[i][3] },
      });

      if (!categoryToFind) {
        categoryToFind = categoriesRepository.create({
          title: lines[i][3],
        });
        await categoriesRepository.save(categoryToFind);
      }
      categoriesArray.push(categoryToFind);

      const transaction = transactionsRepository.create({
        title: lines[i][0],
        type: lines[i][1],
        value: Number(lines[i][2]),
        category_id: categoryToFind.id,
      });

      transactationsImported.push(transaction);
    }

    await transactionsRepository.save(transactationsImported);

    await fs.promises.unlink(filePath);
    return transactationsImported;
  }
}

export default ImportTransactionsService;
