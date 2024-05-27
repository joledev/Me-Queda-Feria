import * as React from "react";
import { StyleSheet, Text, View, ActivityIndicator, FlatList, ListRenderItem, Modal, TouchableOpacity, Button } from "react-native";
import MonthPicker from 'react-native-month-picker';
import { Category, Transaction, TransactionsByMonth } from "../types";
import TransactionListItem from "../components/TransactionListItem";
import Card from "../components/ui/Card";
import AddTransaction from "../components/AddTransaction";
import { Ionicons } from '@expo/vector-icons';
import { API_URL, API_PASSWORD } from '@env';

export default function Home() {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [transactionsByMonth, setTransactionsByMonth] = React.useState<TransactionsByMonth>({
    totalExpenses: 0,
    totalIncome: 0,
  });
  const [paymentMethods, setPaymentMethods] = React.useState([]);
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [loading, setLoading] = React.useState(false);
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [summary, setSummary] = React.useState({ totalIngresos: 0, totalGastos: 0, saldo: 0 });
  const flatListRef = React.useRef<FlatList>(null);

  React.useEffect(() => {
    fetchData(selectedDate);
  }, []);

  async function fetchData(date: Date) {
    if (!date || !(date instanceof Date)) {
      console.error("Invalid date provided to fetchData:", date);
      return;
    }

    console.log("Fetching data for date:", date);

    const month = date.getMonth() + 1; // Months are zero-indexed in JS
    const year = date.getFullYear();
    const monthString = month < 10 ? `0${month}` : month;

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/log.php?month=${year}-${monthString}&api_password=${API_PASSWORD}`);
      const data = await response.json();

      console.log("API response:", data);

      setTransactions(data.logs.reverse()); // Reverse the logs to show the most recent first
      setSummary(data.resumen);
      setTransactionsByMonth({
        totalExpenses: parseFloat(data.resumen.totalGastos),
        totalIncome: parseFloat(data.resumen.totalIngresos),
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPaymentMethods() {
    try {
      const response = await fetch(`${API_URL}/paymentMethod.php?api_password=${API_PASSWORD}`);
      const data = await response.json();
      setPaymentMethods(data);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
    }
  }

  const onDateChange = (dateString: string) => {
    const date = new Date(dateString);

    if (!date || isNaN(date.getTime())) {
      console.error("Invalid date selected:", dateString);
      return;
    }
    
    console.log("Selected date:", date);
    setSelectedDate(date);
    fetchData(date);
    setShowDatePicker(false);
  };

  const showPicker = () => {
    setShowDatePicker(true);
  };

  const scrollToTop = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  };

  const renderItem: ListRenderItem<Transaction | { summary: any, selectedDate: Date }> = ({ item }) => {
    if ("totalIngresos" in item) {
      return (
        <TransactionSummary
          totalExpenses={transactionsByMonth.totalExpenses}
          totalIncome={transactionsByMonth.totalIncome}
          summary={item}
          selectedDate={selectedDate}
          showPicker={showPicker}
        />
      );
    } else {
      return <TransactionListItem transaction={item as Transaction} categories={categories} />;
    }
  };

  const data = [
    { ...summary, selectedDate },
    ...transactions
  ];

  return (
    <View style={styles.mainContainer}>
      <FlatList
        ref={flatListRef}
        contentContainerStyle={styles.container}
        data={data}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        ListHeaderComponent={
          <>
            <AddTransaction insertTransaction={() => fetchData(selectedDate)} fetchPaymentMethods={fetchPaymentMethods} paymentMethods={paymentMethods} />
            {loading && <ActivityIndicator size="large" color="#0000ff" />}
            <Modal visible={showDatePicker} animationType="slide" transparent={true}>
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  <MonthPicker
                    selectedDate={selectedDate}
                    onMonthChange={onDateChange}
                    minDate={new Date(2000, 0)}
                    maxDate={new Date()}
                    locale="es"
                  />
                  <Button title="Cerrar" onPress={() => setShowDatePicker(false)} />
                </View>
              </View>
            </Modal>
          </>
        }
      />
      <TouchableOpacity style={styles.scrollTopButton} onPress={scrollToTop}>
        <Ionicons name="arrow-up" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );
}

function TransactionSummary({ totalIncome, totalExpenses, summary, selectedDate, showPicker }: TransactionsByMonth & { summary: any, selectedDate: Date, showPicker: () => void }) {
  const readablePeriod = selectedDate.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });

  const getMoneyTextStyle = (value: number): TextStyle => ({
    fontWeight: "bold",
    color: value < 0 ? "#ff4500" : "#2e8b57",
  });

  const formatMoney = (value: number) => {
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

  return (
    <Card style={styles.summaryCard}>
      <Text style={styles.periodTitle}>Resumen para {readablePeriod}</Text>
      <Text style={styles.summaryText}>
        Ingresos: <Text style={getMoneyTextStyle(totalIncome)}>{formatMoney(totalIncome)}</Text>
      </Text>
      <Text style={styles.summaryText}>
        Gastos Totales: <Text style={getMoneyTextStyle(totalExpenses)}>{formatMoney(totalExpenses)}</Text>
      </Text>
      <Text style={styles.summaryText}>
        Saldo: <Text style={getMoneyTextStyle(summary.saldo)}>{formatMoney(Number(summary.saldo))}</Text>
      </Text>
      <TouchableOpacity style={styles.fab} onPress={showPicker}>
        <Ionicons name="calendar" size={24} color="white" />
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    position: "relative",
  },
  container: {
    padding: 15,
    backgroundColor: "#f5f5f5",
  },
  summaryCard: {
    marginBottom: 15,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    position: "relative",
  },
  periodTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  summaryText: {
    fontSize: 18,
    color: "#333",
    marginBottom: 10,
  },
  fab: {
    position: "absolute",
    bottom: 15,
    right: 15,
    backgroundColor: "#007bff",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    alignItems: "center",
  },
  scrollTopButton: {
    position: "absolute",
    bottom: 15,
    right: 15,
    backgroundColor: "#007bff",
    width: 40,
    height: 40,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
