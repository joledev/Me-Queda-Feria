import * as React from "react";
import { Button, Text, TextInput, TouchableOpacity, View, StyleSheet, Platform } from "react-native";
import { MaterialIcons, AntDesign } from "@expo/vector-icons";
import Card from "./ui/Card";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { Picker } from "@react-native-picker/picker";
import { Category, Transaction } from "../types";
import { API_URL, API_PASSWORD } from '@env';

export default function AddTransaction({ insertTransaction, fetchPaymentMethods, paymentMethods }: { insertTransaction(transaction: Transaction): Promise<void>, fetchPaymentMethods: () => void, paymentMethods: any[] }) {
  const [isAddingTransaction, setIsAddingTransaction] = React.useState<boolean>(false);
  const [currentTab, setCurrentTab] = React.useState<number>(0);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [typeSelected, setTypeSelected] = React.useState<string>("");
  const [amount, setAmount] = React.useState<string>("");
  const [description, setDescription] = React.useState<string>("");
  const [category, setCategory] = React.useState<string>("Gasto");
  const [categoryId, setCategoryId] = React.useState<number>(1);
  const [paymentMethod, setPaymentMethod] = React.useState<string>("1");
  const [sourceAccount, setSourceAccount] = React.useState<string>("1");
  const [destinationAccount, setDestinationAccount] = React.useState<string>("1");

  const selectedPaymentMethod = paymentMethods.find((method) => method.id === parseInt(paymentMethod));
  const selectedSourceAccount = paymentMethods.find((method) => method.id === parseInt(sourceAccount));
  const selectedDestinationAccount = paymentMethods.find((method) => method.id === parseInt(destinationAccount));

  React.useEffect(() => {
    getExpenseType(currentTab);
  }, [currentTab]);

  React.useEffect(() => {
    if (isAddingTransaction) {
      fetchPaymentMethods();
    }
  }, [isAddingTransaction]);

  async function getExpenseType(currentTab: number) {
    setCategory(currentTab === 0 ? "Gasto" : currentTab === 1 ? "Ingreso" : "Transferencia");
    const type = currentTab === 0 ? "Gasto" : currentTab === 1 ? "Ingreso" : "Transferencia";

    const fetchedCategories: Category[] = []; // Replace with actual fetch
    setCategories(fetchedCategories);
  }

  async function handleSave() {
    const transaction: Transaction = {
      id: Math.floor(Math.random() * 1000000), // Generar un id único para la transacción
      amount: Number(amount),
      description,
      category_id: categoryId,
      date: new Date().getTime() / 1000,
      type: currentTab === 0 ? "Expense" : currentTab === 1 ? "Income" : "Transfer",
      paymentMethod: currentTab === 2 ? `${sourceAccount} a ${destinationAccount}` : paymentMethod,
    };

    if (currentTab === 0) {
      // Es un gasto, enviar a la API de creación de gastos
      try {
        const response = await fetch(`${API_URL}/expense.php?api_password=${API_PASSWORD}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id_payment: paymentMethod, // Este debe ser el ID del método de pago
            amount: transaction.amount,
            description: transaction.description,
          }),
        });

        const data = await response.json();
        if (response.ok) {
          console.log('Gasto creado exitosamente:', data);
        } else {
          console.error('Error al crear el gasto:', data);
        }
      } catch (error) {
        console.error('Error en la solicitud:', error);
      }
    } else if (currentTab === 1) {
      // Es un ingreso, enviar a la API de creación de ingresos
      try {
        const response = await fetch(`${API_URL}/income.php?api_password=${API_PASSWORD}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id_payment: paymentMethod, // Este debe ser el ID del método de pago
            amount: transaction.amount,
            description: transaction.description,
          }),
        });

        const data = await response.json();
        if (response.ok) {
          console.log('Ingreso creado exitosamente:', data);
        } else {
          console.error('Error al crear el ingreso:', data);
        }
      } catch (error) {
        console.error('Error en la solicitud:', error);
      }
    } else if (currentTab === 2) {
      // Es una transferencia, enviar a la API de creación de transferencias
      try {
        const response = await fetch(`${API_URL}/transaction.php?api_password=${API_PASSWORD}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id_payment_sender: sourceAccount, // Este debe ser el ID de la cuenta de origen
            id_payment_receiver: destinationAccount, // Este debe ser el ID de la cuenta de destino
            amount: transaction.amount,
            description: transaction.description,
          }),
        });

        const data = await response.json();
        if (response.ok) {
          console.log('Transferencia creada exitosamente:', data);
        } else {
          console.error('Error al crear la transferencia:', data);
        }
      } catch (error) {
        console.error('Error en la solicitud:', error);
      }
    }

    await insertTransaction(transaction);
    setAmount("");
    setDescription("");
    setCategory("Gasto");
    setCategoryId(1);
    setPaymentMethod("1");
    setSourceAccount("1");
    setDestinationAccount("1");
    setCurrentTab(0);
    setIsAddingTransaction(false);
  }

  const formatCurrency = (value: number | string) => {
    return Number(value).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

  const getNewBalance = (saldo: number, amount: string, isExpense: boolean) => {
    const numericAmount = Number(amount);
    if (isNaN(numericAmount)) return saldo;

    return isExpense ? saldo - numericAmount : saldo + numericAmount;
  };

  const renderNewBalance = (saldo: number, amount: string, isExpense: boolean) => {
    return (
      <Text style={styles.saldoText}>
        Saldo: {formatCurrency(saldo)} <AntDesign name="arrowright" size={13} /> {formatCurrency(getNewBalance(saldo, amount, isExpense))}
      </Text>
    );
  };

  return (
    <View style={styles.container}>
      {isAddingTransaction ? (
        <View>
          <Card style={styles.card}>
            <TextInput
              placeholder="$Cantidad"
              style={styles.inputAmount}
              keyboardType="numeric"
              onChangeText={(text) => {
                const numericValue = text.replace(/[^0-9.]/g, "");
                setAmount(numericValue);
              }}
              value={amount}
            />
            <TextInput placeholder="Descripción" style={styles.inputDescription} onChangeText={setDescription} value={description} />
            <Text style={styles.entryTypeText}>Selecciona un tipo de movimiento</Text>
            <SegmentedControl
              values={["Gasto", "Ingreso", "Movimiento"]}
              style={styles.segmentedControl}
              selectedIndex={currentTab}
              onChange={(event) => {
                setCurrentTab(event.nativeEvent.selectedSegmentIndex);
              }}
            />
            {currentTab === 2 ? (
              <>
                <Text style={styles.pickerLabel}>Cuenta de origen:</Text>
                <Picker selectedValue={sourceAccount} style={styles.picker} onValueChange={(itemValue) => setSourceAccount(itemValue)}>
                  {paymentMethods.map((method) => (
                    <Picker.Item key={method.id} label={`${method.nombre} (Saldo: ${formatCurrency(method.saldo)})`} value={method.id} />
                  ))}
                </Picker>
                {amount ? renderNewBalance(selectedSourceAccount.saldo, amount, true) : null}
                <Text style={styles.pickerLabel}>Cuenta de destino:</Text>
                <Picker selectedValue={destinationAccount} style={styles.picker} onValueChange={(itemValue) => setDestinationAccount(itemValue)}>
                  {paymentMethods.map((method) => (
                    <Picker.Item key={method.id} label={`${method.nombre} (Saldo: ${formatCurrency(method.saldo)})`} value={method.id} />
                  ))}
                </Picker>
                {amount ? renderNewBalance(selectedDestinationAccount.saldo, amount, false) : null}
              </>
            ) : (
              <>
                <Picker selectedValue={paymentMethod} style={styles.picker} onValueChange={(itemValue) => setPaymentMethod(itemValue)}>
                  {paymentMethods.map((method) => (
                    <Picker.Item key={method.id} label={`${method.nombre} (Saldo: ${formatCurrency(method.saldo)})`} value={method.id} />
                  ))}
                </Picker>
                {amount ? renderNewBalance(selectedPaymentMethod.saldo, amount, currentTab === 0) : null}
              </>
            )}
            {categories.map((cat) => (
              <CategoryButton
                key={cat.name}
                id={cat.id}
                title={cat.name}
                isSelected={typeSelected === cat.name}
                setTypeSelected={setTypeSelected}
                setCategoryId={setCategoryId}
              />
            ))}
          </Card>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setIsAddingTransaction(false)}>
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
              <Text style={styles.buttonText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <AddButton setIsAddingTransaction={setIsAddingTransaction} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  card: {
    marginBottom: 15,
  },
  inputAmount: {
    fontSize: 32,
    marginBottom: 15,
    fontWeight: "bold",
    color: "#333",
  },
  inputDescription: {
    marginBottom: 15,
    fontSize: 16,
    color: "#333",
  },
  entryTypeText: {
    marginBottom: 6,
    fontSize: 16,
    color: "#333",
  },
  pickerLabel: {
    fontSize: 16,
    marginBottom: 6,
    color: "#333",
  },
  saldoText: {
    fontSize: 14,
    color: "#007BFF",
    marginBottom: 15,
  },
  picker: {
    height: 50,
    width: "100%",
    marginBottom: 15,
  },
  segmentedControl: {
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  cancelButton: {
    backgroundColor: "red",
  },
  saveButton: {
    backgroundColor: "blue",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  categoryButton: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    marginBottom: 6,
    paddingHorizontal: 10,
  },
  addButton: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007BFF20",
    borderRadius: 15,
    marginBottom: 15,
  },
  addButtonText: {
    fontWeight: "700",
    color: "#007BFF",
    marginLeft: 5,
  },
});

function CategoryButton({
  id,
  title,
  isSelected,
  setTypeSelected,
  setCategoryId,
}: {
  id: number;
  title: string;
  isSelected: boolean;
  setTypeSelected: React.Dispatch<React.SetStateAction<string>>;
  setCategoryId: React.Dispatch<React.SetStateAction<number>>;
}) {
  return (
    <TouchableOpacity
      onPress={() => {
        setTypeSelected(title);
        setCategoryId(id);
      }}
      activeOpacity={0.6}
      style={[
        styles.categoryButton,
        {
          backgroundColor: isSelected ? "#007BFF20" : "#00000020",
        },
      ]}
    >
      <Text
        style={{
          fontWeight: "700",
          color: isSelected ? "#007BFF" : "#000000",
          marginLeft: 5,
        }}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

function AddButton({ setIsAddingTransaction }: { setIsAddingTransaction: React.Dispatch<React.SetStateAction<boolean>> }) {
  return (
    <TouchableOpacity onPress={() => setIsAddingTransaction(true)} activeOpacity={0.6} style={styles.addButton}>
      <MaterialIcons name="add-circle-outline" size={24} color="#007BFF" />
      <Text style={styles.addButtonText}>Movimiento</Text>
    </TouchableOpacity>
  );
}
