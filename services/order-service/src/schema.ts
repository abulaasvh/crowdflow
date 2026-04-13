import { gql } from 'mercurius';

export const typeDefs = gql`
  type MenuItem {
    id: ID!
    name: String!
    description: String!
    price: Float!
    category: String!
    imageUrl: String
    isAvailable: Boolean!
  }

  type Order {
    id: ID!
    userId: String!
    orderNumber: String!
    status: String!
    totalPrice: Float!
    seatInfo: String
    items: [OrderItem!]!
    createdAt: String!
  }

  type OrderItem {
    id: ID!
    menuItem: MenuItem!
    quantity: Int!
    unitPrice: Float!
  }

  input OrderItemInput {
    menuItemId: ID!
    quantity: Int!
  }

  input CreateOrderInput {
    userId: String!
    seatInfo: String
    items: [OrderItemInput!]!
    useMockPayment: Boolean
  }

  type CreateOrderResponse {
    order: Order!
    paymentIntentClientSecret: String
  }

  type Query {
    getMenu: [MenuItem!]!
    getOrders(userId: String!): [Order!]!
    getOrder(id: ID!): Order
  }

  type Mutation {
    createOrder(input: CreateOrderInput!): CreateOrderResponse!
    updateOrderStatus(orderId: ID!, status: String!): Order!
  }
`;
