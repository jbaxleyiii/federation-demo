import { ApolloServer, gql } from 'apollo-server';
import { buildFederatedSchema } from "@apollo/federation";
import { Product, ProductDataSource } from './data';

const typeDefs = gql`
	extend type Product @key(fields: "sku") {
		sku: String! @external
		inStock: Boolean 
		quantity: Int
	}
`;

const resolvers: any = {
	Product: {
		async __resolveReference({ sku }: Product, { dataSources }: Context) {
			const product = await dataSources.products.find(sku);
			return {
				...product,
				sku // keep the sku from other services since this won't match with fake data
			}
		},
	}
}
const server = new ApolloServer({
	schema: buildFederatedSchema([{ typeDefs, resolvers }]),
	dataSources: () => ({
		products: new ProductDataSource()
	}),
	engine: true
});

const port = process.env.PORT || 4002

server.listen({ port }).then(({ url }) => {
	console.log(`Apollo Server is now running at ${url}`);
});

interface Context {
	dataSources: {
	  products: ProductDataSource;
	};
  }
  