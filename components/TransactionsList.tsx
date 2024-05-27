import React from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { Category, Transaction } from "../types";
import TransactionListItem from "./TransactionListItem";

type Props = {
  categories: Category[];
  transactions: Transaction[];
  deleteTransaction: (id: number) => void;
};

const TransactionList: React.FC<Props> = ({ categories, transactions, deleteTransaction }) => {
  return (
    <FlatList
      contentContainerStyle={styles.container}
      data={transactions}
      renderItem={({ item }) => <TransactionListItem transaction={item} categories={categories} />}
      keyExtractor={(item) => item.id.toString()}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 15,
  },
});

export default TransactionList;
