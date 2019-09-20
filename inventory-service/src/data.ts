import { DataSource } from "apollo-datasource";
import DataLoader from "dataloader";
import faker from "faker";

export interface Product {
	sku: string
	inStock: boolean
	quantity: number
}

export class ProductDataSource implements DataSource {
	private loader?: DataLoader<string, Product>;
	private products: Product[] = []
	constructor() {
		// create some fake data at startup pf server
		faker.seed(123);
	
		for (let i = 0; i < 10000; i++) {
		  this.products.push({
			sku: faker.random.uuid(),
			inStock: faker.random.boolean(),
			quantity: faker.random.number(),
		  });
		}
	  }

	initialize() {
	  this.loader = new DataLoader((keys: string[]) => {
		const offset = faker.random.number(50);
		return Promise.resolve(
		  // since we are just using faked data, our sku's will never
		  // actually match up so we select a product at random
		  this.products.slice(offset, keys.length + offset)
		)
	  })
	} // where you can get access to context and cache
	find(sku: string) {
	  return this.loader!.load(sku);
	}
  }
  