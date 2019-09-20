import { DataSource } from "apollo-datasource";
import DataLoader from "dataloader";
import faker from "faker";

export interface Product {
  upc: string;
  sku: string;
  name: string;
  price: string;
  userId?: string;
}

export interface ProductConnection {
  products: Product[];
}

export class ProductDataSource implements DataSource {
  private loader?: DataLoader<string, Product>;
  private products: Product[] = [];

  constructor() {
    // create some fake data at startup pf server
    faker.seed(123);

    for (let i = 0; i < 10000; i++) {
      this.products.push({
        name: faker.commerce.product(),
        sku: faker.random.uuid(),
        upc: faker.random.uuid(),
        price: faker.commerce.price(),
        userId: faker.random.boolean() ? "watson" : undefined
      });
    }
  }

  initialize() {
    this.loader = new DataLoader((keys: string[]) =>
      Promise.resolve(
        this.products.filter(({ upc, sku }) => {
          return keys.indexOf(upc) > -1 || keys.indexOf(sku) > -1;
        })
      )
    );
  }

  find({ upc, sku }: Product): Promise<Product | null> {
    return this.loader!.load(upc || sku);
  }

  async getProducts(first: number, after: number): Promise<ProductConnection> {
    const products = [...this.products.slice(after, first + after)];
    return { products };
  }

  async getSuggestedProductsForUser(
    id: string,
    first: number,
    after: number
  ): Promise<ProductConnection> {
    // load the users product ids first
    const products = [
      ...this.products
        .filter(({ userId }) => userId === id)
        .slice(after, first + after)
    ];
    return { products };
  }
}

export class TooManyRecordsRequestedError {
	message: string = "";
	numberOfRecordsRequested: number = 0;
	constructor(numberOfRecords: number){
		this.message = `You can only request up to 100 records at one time; you requested ${numberOfRecords}`;
		this.numberOfRecordsRequested = numberOfRecords;
	}
	
 }
export class NoProductsFoundError {
	didYouMean: Array<string> = [];
 }