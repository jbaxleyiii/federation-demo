import { ApolloServer, gql } from "apollo-server";
import { buildFederatedSchema } from "@apollo/federation";
import {
  ProductDataSource,
  TooManyRecordsRequestedError,
  NoProductsFoundError,
  Product,
  ProductConnection
} from "./data";

const typeDefs = gql`
  type Product @key(fields: "upc") @key(fields: "sku") {
    upc: String!
    sku: String!
    name: String
    price: String
  }

  type ProductConnection {
    products: [Product]
  }

  extend type User @key(fields: "id") {
    id: String! @external
    suggestedProducts(first: Int = 50, after: Int = 0): ProductConnection
  }

  type TooManyRecordsRequestedError {
    message: String
  }

  type NoProductsFoundError {
    didYouMean: [String]
  }

  union ProductResults =
      ProductConnection
    | TooManyRecordsRequestedError
    | NoProductsFoundError

  extend type Query {
    allProducts(first: Int = 50, after: Int = 0): ProductResults
  }
`;

const resolvers: any = {
  Query: {
    async allProducts(
      _: any,
      { first, after }: AllProductsArgs,
      { dataSources }: Context
    ) {
      if (first > 100) {
        return new TooManyRecordsRequestedError(first);
      }

      const products = await dataSources.products.getProducts(first, after);
      return products.products.length ? products : new NoProductsFoundError();
    }
  },
  ProductResults: {
    __resolveType(
      products:
        | TooManyRecordsRequestedError
        | NoProductsFoundError
        | ProductConnection,
      _context: any
    ) {
      if (products instanceof TooManyRecordsRequestedError) {
        return "TooManyRecordsRequestedError";
      }
      if (products instanceof NoProductsFoundError) {
        return "NoProductsFoundError";
      }

      return "ProductConnection";
    }
  },
  Product: {
    __resolveReference(product: Product, { dataSources }: Context) {
      return dataSources.products.find(product);
    }
  },
  User: {
    __resolveReference( user: User ): User {
      // this is where you would look up a user by id
      return user;
    },
    suggestedProducts(user: User, args: AllProductsArgs, { dataSources }: Context) {
      return dataSources.products.getSuggestedProductsForUser(
        user.id,
        args.first,
        args.after
      );
    }
  }
};

const server = new ApolloServer({
  schema: buildFederatedSchema([{ typeDefs, resolvers }]),
  dataSources: () => ({
    products: new ProductDataSource()
  }),
  engine: true
});

const port = process.env.PORT || 4001;

server.listen({ port }).then(({ url }) => {
  console.log(`Apollo Server is now running at ${url}`);
});

type AllProductsArgs = {
  first: number;
  after: number;
};

type User = {
  id: string;
};

interface Context {
  dataSources: {
    products: ProductDataSource;
  };
}
