import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Constants from 'expo-constants';
import { StatusBar } from "expo-status-bar"
import { FontAwesome } from "@expo/vector-icons"
import * as SQLite from 'expo-sqlite';
import * as Updates from 'expo-updates';

const db = SQLite.openDatabase("db.db");

function Items({ done: doneHeading, onPressItem }) {

  const [items, setItems] = React.useState(null);

  React.useEffect(() => {
    db.transaction(tx => {
      tx.executeSql(
        `select * from items where done = ?;`,
        [doneHeading ? 1 : 0],
        (_, { rows: { _array } }) => setItems(_array)
      );
    });
  }, []);

  const heading = doneHeading ? "Feito" : "A Fazer";

  if (items === null || items.length === 0) {
    return null;
  }

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionHeading}>{heading}</Text>
      {items.map(({ id, done, value }) => (
        <TouchableOpacity
          key={id}
          onPress={() => onPressItem && onPressItem(id)}
          style={{
            backgroundColor: done ? "#c9c9c9" : "#fff",
            borderColor: "#F7F7F7",
            borderWidth: done ? 0 : 1,
            padding: 8,
            borderRadius: 10,
            marginBottom: 5,
            height: 53,
            justifyContent: "center"
          }}
        >
          <Text style={{ color: "#1a1a1a" }}>{value}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function App() {
  const [text, setText] = React.useState(null)
  const [forceUpdate, forceUpdateId] = useForceUpdate()

  React.useEffect(() => {
    async function updateApp() {
      const { isAvailable } = await Updates.checkForUpdateAsync();
      if (isAvailable) {
        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync(); // depende da sua estratégia
      }
    }
    updateApp();
  }, []);

  React.useEffect(() => {
    db.transaction(tx => {
      tx.executeSql(
        "create table if not exists items (id integer primary key not null, done int, value text);"
      );
    });
  }, []);

  const add = (text) => {
    // is text empty?
    if (text === null || text === "") {
      return false;
    }

    db.transaction(
      tx => {
        tx.executeSql("insert into items (done, value) values (0, ?)", [text]);
        tx.executeSql("select * from items", [], (_, { rows }) =>
          console.table(JSON.stringify(rows))
        );
      },
      null,
      forceUpdate
    );
  }

  return (
    <View style={styles.container}>

      <StatusBar backgroundColor="#E8EAED" style="auto" />
      
      <ScrollView style={styles.listArea}>
        <Items
          key={`forceupdate-todo-${forceUpdateId}`}
          done={false}
          onPressItem={id =>
            db.transaction(
              tx => {
                tx.executeSql(`update items set done = 1 where id = ?;`, [
                  id
                ]);
              },
              null,
              forceUpdate
            )
          }
        />
        <Items
          done
          key={`forceupdate-done-${forceUpdateId}`}
          onPressItem={id =>
            db.transaction(
              tx => {
                tx.executeSql(`delete from items where id = ?;`, [id]);
              },
              null,
              forceUpdate
            )
          }
        />
      </ScrollView>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flexRow}>
        <TextInput
          onChangeText={text => setText(text)}
          onSubmitEditing={() => {
            add(text);
            setText(null);
          }}
          placeholder="O que você precisa fazer?"
          style={styles.input}
          value={text}
        />
        <TouchableOpacity 
          onPress={() => {
            add(text);
            setText(null);
          }}
          style={[styles.input, styles.botao_input]} >
          <FontAwesome name="plus" color="#C0C0C0" size={18} />
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );

}

function useForceUpdate() {
  const [value, setValue] = useState(0);
  return [() => setValue(value + 1), value];
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    flex: 1,
    paddingTop: Constants.statusBarHeight
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    color: "#6A6180",
    marginTop: 10,
    marginBottom: 10,
  },
  flexRow: {
    flexDirection: "row",
    width: "100%",
    paddingHorizontal: 15,
    justifyContent: "space-evenly",
    position: "absolute",
    bottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 1,

    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    height: 50,
    width: "80%",
    paddingHorizontal: 10,
  },
  botao_input: {
    justifyContent: "center",
    paddingHorizontal: 0,
    width: 50,
    alignItems: "center"
  },
  texto_botao_input: {
    fontSize: 24,
    color: "#C0C0C0"
  },
  listArea: {
    backgroundColor: "#E8EAED",
    flex: 1,
    paddingTop: 16
  },
  sectionContainer: {
    marginBottom: 16,
    marginHorizontal: 16
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#1a1a1a",
  }
});
