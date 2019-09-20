import { ApolloServer, gql } from "apollo-server";
import { buildFederatedSchema } from "@apollo/federation";
import { DataSource } from "apollo-datasource";
import DataLoader from "dataloader";

const typeDefs = gql`
  extend type Query {
    me: User
  }
  type User @key(fields: "id") {
    id: String!
    email: String
  }
`;

const resolvers: any = {
  Query: {
    me(): User {
      return users[0];
    }
  },
  User: {
    __resolveReference(user: Pick<User, "id">, { dataSources }: Context) {
      return dataSources.users.find(user.id);
    }
  }
};

const users = [{ id: "watson", email: "watson@apollographql.com" }];

class UsersDataSource implements DataSource {
  private loader?: DataLoader<string, User>;
  initialize() {
    this.loader = new DataLoader((keys: string[]) =>
      Promise.resolve(
        users.filter(({ id }) => {
          return keys.indexOf(id) > -1;
        })
      )
    );
  } // where you can get access to context and cache
  find(id: string) {
    return this.loader!.load(id);
  }
}

const server = new ApolloServer({
  schema: buildFederatedSchema([{ typeDefs, resolvers }]),
  engine: true,
  dataSources: () => ({ users: new UsersDataSource() })
});

const port = process.env.PORT || 4003;

server.listen({ port }).then(({ url }) => {
  console.log(`Apollo Server is now running at ${url}`);
});

interface User {
  id: string;
  email?: string;
}

interface Context {
  dataSources: {
    users: UsersDataSource;
  };
}
