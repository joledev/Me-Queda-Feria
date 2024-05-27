import React from "react";
import { View, Text, StyleSheet, TextStyle } from "react-native";
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { Transaction, Category } from "../types";
import Card from "./ui/Card";

type Props = {
  transaction: Transaction;
  categories: Category[];
};

const TransactionListItem: React.FC<Props> = ({ transaction, categories }) => {
  const { movement_type, details } = transaction;

  const getIcon = () => {
    let library = "";
    let iconName = "";
    let color = "";

    switch (movement_type) {
      case "Ingreso":
        library = "AntDesign";
        iconName = "pluscircle";
        color = "green";
        break;
      case "Ingreso Eliminado":
        library = "AntDesign";
        iconName = "pluscircle";
        color = "green";
        break;
      case "Gasto":
        library = "AntDesign";
        iconName = "minuscircle";
        color = "red";
        break;
      case "Gasto Eliminado":
        library = "AntDesign";
        iconName = "minuscircle";
        color = "red";
        break;
      case "Transferencia":
        library = "AntDesign";
        iconName = "swap";
        color = "blue";
        break;
      case "Transferencia Eliminada":
        library = "AntDesign";
        iconName = "swap";
        color = "blue";
        break;
      default:
        library = "Ionicons";
        iconName = "help-circle";
        color = "gray";
    }

    return <AntDesign name={iconName} size={24} color={color} />;
  };

  const getTransactionDescription = () => {
    switch (movement_type) {
      case "Ingreso":
        return `Ingreso: ${details.descripcion}`;
      case "Ingreso Eliminado":
        return `Ingreso Eliminado: ${details.descripcion}`;
      case "Gasto":
        return `Gasto: ${details.descripcion}`;
      case "Gasto Eliminado":
        return `Gasto Eliminado: ${details.descripcion}`;
      case "Transferencia":
        return `Transferencia: ${details.descripcion}`;
      case "Transferencia Eliminada":
        return `Transferencia Eliminada: ${details.descripcion}`;
      default:
        return `Tipo de transacción desconocido: ${movement_type}`;
    }
  };

  const getFormattedDate = (dateString: string) => {
    const date = new Date(dateString);
    date.setHours(date.getHours() - 8); // Convert UTC to UTC-8
    const options: Intl.DateTimeFormatOptions = { 
      day: "2-digit", 
      month: "short", 
      year: "numeric", 
      hour: "2-digit", 
      minute: "2-digit",
      hour12: true 
    };
    return date.toLocaleDateString("es-ES", options);
  };

  const getTextStyle = (before: number, after: number, type: string): TextStyle => {
    if (type === "Transferencia") {
      return { color: "#007bff" };
    }
    return { color: before > after ? "#ff4500" : "#2e8b57" };
  };

  const formatCurrency = (value: number | string) => {
    return Number(value).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

  return (
    <Card style={styles.container}>
      <View style={styles.row}>
        {getIcon()}
        <View style={styles.transactionInfo}>
          <Text style={styles.headerText}>{getTransactionDescription()}</Text>
          <Text style={styles.amount}>{formatCurrency(details.cantidad)}</Text>
          <Text style={styles.text}>Fecha: {getFormattedDate(details.fecha)}</Text>
          {details.id_payment && (
            <Text style={styles.text}>Método de Pago: {details.payment_method_name}</Text>
          )}
          {details.id_payment_sender && (
            <Text style={styles.text}>Método de Pago Emisor: {details.nombre_payment_sender}</Text>
          )}
          {details.id_payment_receiver && (
            <Text style={styles.text}>Método de Pago Receptor: {details.nombre_payment_receiver}</Text>
          )}
          {details.cantidad_antes && details.cantidad_despues && (
            <Text style={[styles.text, getTextStyle(Number(details.cantidad_antes), Number(details.cantidad_despues), movement_type)]}>
              Antes: {formatCurrency(details.cantidad_antes)} <AntDesign name="arrowright" size={13} /> Después: {formatCurrency(details.cantidad_despues)}
            </Text>
          )}

          {details.cantidad_antes_sender && details.cantidad_despues_sender !== undefined && (
            <Text style={[styles.text, getTextStyle(Number(details.cantidad_antes_sender), Number(details.cantidad_despues_sender), movement_type)]}>
              Antes Emisor: {formatCurrency(details.cantidad_antes_sender)} <AntDesign name="arrowright" size={13} /> Después Emisor: {formatCurrency(details.cantidad_despues_sender)}
            </Text>
          )}
          
          {details.cantidad_antes_receiver && details.cantidad_despues_receiver !== undefined && (
            <Text style={[styles.text, getTextStyle(Number(details.cantidad_antes_receiver), Number(details.cantidad_despues_receiver), movement_type)]}>
              Antes Receptor: {formatCurrency(details.cantidad_antes_receiver)} <AntDesign name="arrowright" size={13} /> Después Receptor: {formatCurrency(details.cantidad_despues_receiver)}
            </Text>
          )}
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  transactionInfo: {
    marginLeft: 10,
    flex: 1,
  },
  amount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  headerText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  text: {
    fontSize: 14,
    color: "#666",
  },
});

export default TransactionListItem;
