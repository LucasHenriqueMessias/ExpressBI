import './App.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, get, child, onValue } from "firebase/database";
import * as XLSX from "xlsx"; // Importa a biblioteca XLSX
import { useEffect, useState } from "react";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_DATABASE_URL,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID,
  measurementId: process.env.REACT_APP_MEASUREMENT_ID,
};

// Inicialização do Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

function App() {
  const [clientes, setClientes] = useState([]); // Estado para armazenar os clientes

  console.log("Firebase initialized:", app);

  // Função para lidar com o envio do formulário
  const handleFormSubmit = (event) => {
    event.preventDefault(); // Evita o comportamento padrão de recarregar a página

    // Captura os dados do formulário
    const formData = new FormData(event.target);
    const clienteData = {
      nome: formData.get("nome"),
      nascimento: formData.get("nascimento"),
      email: formData.get("email"),
      cpf: formData.get("cpf"),
      observacoes: formData.get("observacoes"),
      faturamento: parseFloat(formData.get("faturamento")),
      status: formData.get("status"),
    };

    // Envia os dados para o Firebase
    const clientesRef = ref(database, "tab_clientes");
    push(clientesRef, clienteData)
      .then(() => {
        alert("Cliente cadastrado com sucesso!");
        event.target.reset(); // Limpa o formulário
      })
      .catch((error) => {
        console.error("Erro ao cadastrar cliente:", error);
        alert("Erro ao cadastrar cliente. Tente novamente.");
      });
  };

  // Função para buscar os dados do Firebase
  const fetchClientes = () => {
    const clientesRef = ref(database, "tab_clientes");
    onValue(clientesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const clientesArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setClientes(clientesArray); // Atualiza o estado com os dados dos clientes
      } else {
        setClientes([]); // Caso não haja dados, limpa o estado
      }
    });
  };

  // Função para exportar os dados para Excel
  const handleExportToExcel = async () => {
    const dbRef = ref(database);
    try {
      const snapshot = await get(child(dbRef, "tab_clientes"));
      if (snapshot.exists()) {
        const data = snapshot.val();
        const clientesArray = Object.keys(data).map((key) => data[key]);

        // Cria uma planilha Excel
        const worksheet = XLSX.utils.json_to_sheet(clientesArray);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Clientes");

        // Gera o arquivo Excel e faz o download
        XLSX.writeFile(workbook, "clientes.xlsx");
      } else {
        alert("Nenhum dado encontrado para exportar.");
      }
    } catch (error) {
      console.error("Erro ao exportar dados:", error);
      alert("Erro ao exportar dados. Tente novamente.");
    }
  };

  // Busca os dados ao carregar o componente
  useEffect(() => {
    fetchClientes();
  }, []);

  return (
    <>
      <div>
        <header>
          <h1>
            <i className="fas fa-coins"></i> ExpressBI
          </h1>
          <p>Cadastro e controle financeiro de clientes</p>
        </header>
        <nav>
          <a href="#cadastro">Cadastro</a>
          <a href="#lista">Lista de Clientes</a>
        </nav>

        <div className="container">
          <section id="cadastro">
            <h2>Cadastro de Cliente</h2>
            <form id="clienteForm" onSubmit={handleFormSubmit}>
              <input type="text" placeholder="Nome" name="nome" required />
              <input type="date" name="nascimento" required />
              <input type="email" placeholder="E-mail" name="email" required />
              <input type="text" placeholder="CPF/CNPJ" name="cpf" required />
              <textarea placeholder="Observações" name="observacoes"></textarea>
              <input
                type="number"
                placeholder="Faturamento mensal médio (R$)"
                name="faturamento"
                step="0.01"
                required
              />
              <select name="status">
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
              <button type="submit">Cadastrar</button>
            </form>
          </section>

          <section id="lista">
            <h2>Clientes Cadastrados</h2>
            <button onClick={handleExportToExcel}>Exportar para Excel</button>
            <table id="tabelaClientes">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>CPF/CNPJ</th>
                  <th>Faturamento</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((cliente) => (
                  <tr key={cliente.id}>
                    <td>{cliente.nome}</td>
                    <td>{cliente.email}</td>
                    <td>{cliente.cpf}</td>
                    <td>{cliente.faturamento}</td>
                    <td>{cliente.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </>
  );
}

export default App;