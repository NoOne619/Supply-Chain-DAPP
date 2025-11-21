import { useState, useEffect } from "react";
import { ethers } from "ethers";
import contractAbi from "./contractAbi.json";

const CONTRACT_ADDRESS = "0x83D76B84B9550a98B0Aa5f921D4a2DC15e883Da7";

function App() {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastRegisteredId, setLastRegisteredId] = useState(null);

  // Independent inputs for each role
  const [regName, setRegName] = useState("");
  const [regDesc, setRegDesc] = useState("");

  const [distPid, setDistPid] = useState("");
  const [distAddr, setDistAddr] = useState("");

  const [retailPid, setRetailPid] = useState("");
  const [retailAddr, setRetailAddr] = useState("");

  const [consumerPid, setConsumerPid] = useState("");
  const [consumerAddr, setConsumerAddr] = useState("");

  const connectWallet = async () => {
    if (!window.ethereum) return alert("Please install MetaMask!");

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x13882" }] });

      const signer = await provider.getSigner();
      const addr = await signer.getAddress();
      const ctr = new ethers.Contract(CONTRACT_ADDRESS, contractAbi, signer);

      setAccount(addr);
      setContract(ctr);
      loadProducts(ctr);
    } catch (err) {
      alert("Failed to connect! Make sure you're on Polygon Amoy network.");
    }
  };

  const loadProducts = async () => {
    if (!contract) return;
    setLoading(true);
    const list = [];
    try {
      const count = await contract.productCount();
      for (let i = 1; i <= Number(count); i++) {
        const p = await contract.getProduct(i);
        const h = await contract.getProductHistory(i);
        list.push({
          id: Number(p[0]),
          name: p[1],
          desc: p[2],
          owner: p[3],
          status: p[4],
          history: h
        });
      }
      setProducts(list);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const registerProduct = async () => {
    if (!regName.trim() || !regDesc.trim()) {
      return alert("Please enter both Product Name and Description");
    }
    try {
      const tx = await contract.registerProduct(regName, regDesc);
      const receipt = await tx.wait();

      const event = receipt.logs
        .map(log => {
          try { return contract.interface.parseLog(log); } catch { return null; }
        })
        .find(e => e && e.name === "ProductRegistered");

      const newId = event ? Number(event.args.id) : "Unknown";
      setLastRegisteredId(newId);
      alert(`SUCCESS! Product registered with ID: ${newId}`);
      setRegName("");
      setRegDesc("");
      loadProducts();
    } catch (err) {
      alert("Only the Manufacturer (deployer) can register products!");
    }
  };

  const transferToDistributor = async () => {
    if (!distPid.trim()) return alert("Enter Product ID");
    if (!distAddr.trim() || !ethers.isAddress(distAddr)) return alert("Enter valid Distributor address (0x...)");

    try {
      setLoading(true);
      const tx = await contract.transferToDistributor(distPid, distAddr);
      await tx.wait();
      alert(`Product ${distPid} successfully transferred to Distributor!`);
      setDistPid(""); setDistAddr("");
      loadProducts();
    } catch (err) {
      alert("Transfer Failed!\nPossible reasons:\n• You are not the Manufacturer\n• Product is not in 'Manufactured' stage\n• Product ID doesn't exist");
    } finally {
      setLoading(false);
    }
  };

  const transferToRetailer = async () => {
    if (!retailPid.trim()) return alert("Enter Product ID");
    if (!retailAddr.trim() || !ethers.isAddress(retailAddr)) return alert("Enter valid Retailer address");

    try {
      setLoading(true);
      const tx = await contract.transferToRetailer(retailPid, retailAddr);
      await tx.wait();
      alert(`Product ${retailPid} successfully transferred to Retailer!`);
      setRetailPid(""); setRetailAddr("");
      loadProducts();
    } catch (err) {
      alert("Transfer Failed!\nPossible reasons:\n• You are not the current Distributor\n• Product is not in 'Distributed' stage");
    } finally {
      setLoading(false);
    }
  };

  const sellToConsumer = async () => {
    if (!consumerPid.trim()) return alert("Enter Product ID");
    if (!consumerAddr.trim() || !ethers.isAddress(consumerAddr)) return alert("Enter valid Consumer address");

    try {
      setLoading(true);
      const tx = await contract.sellToConsumer(consumerPid, consumerAddr);
      await tx.wait();
      alert(`Product ${consumerPid} successfully sold to Consumer!`);
      setConsumerPid(""); setConsumerAddr("");
      loadProducts();
    } catch (err) {
      alert("Sale Failed!\nPossible reasons:\n• You are not the current Retailer\n• Product is not in 'Retailed' stage");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", background: "#f8fafc", minHeight: "100vh", padding: "20px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <h1 style={{ textAlign: "center", color: "#5b21b6", fontSize: "42px" }}>
          Abdullah – Supply Chain DApp
        </h1>
        <p style={{ textAlign: "center", fontSize: "24px", color: "#7c3aed" }}>
          Supply Chain on Polygon Amoy Testnet
        </p>
        <p style={{ textAlign: "center", fontSize: "18px" }}>
          Contract: <strong>{CONTRACT_ADDRESS}</strong>
        </p>

        {!account ? (
          <div style={{ textAlign: "center", margin: "50px" }}>
            <button onClick={connectWallet} style={bigButton}>
              Connect MetaMask (Polygon Amoy)
            </button>
          </div>
        ) : (
          <div style={{ textAlign: "center", background: "#e0e7ff", padding: "20px", borderRadius: "15px", marginBottom: "30px" }}>
            Connected as: <strong>{account}</strong>
            <button onClick={loadProducts} style={refreshBtn}>Refresh Products</button>
          </div>
        )}

        {lastRegisteredId && (
          <div style={{ textAlign: "center", background: "#dcfce7", color: "#166534", padding: "30px", borderRadius: "20px", margin: "30px 0", fontSize: "32px", fontWeight: "bold" }}>
            New Product Created! ID = {lastRegisteredId}
          </div>
        )}

        {/* Manufacturer */}
        <div style={card}>
          <h2 style={{ color: "#7c3aed" }}>1. Manufacturer – Register Product</h2>
          <input placeholder="Product Name" value={regName} onChange={e => setRegName(e.target.value)} style={input} />
          <input placeholder="Description" value={regDesc} onChange={e => setRegDesc(e.target.value)} style={input} />
          <button onClick={registerProduct} style={purpleBtn}>Register Product</button>
        </div>

        {/* Distributor */}
        <div style={card}>
          <h2 style={{ color: "#dc2626" }}>2. Distributor – Receive Product</h2>
          <input placeholder="Product ID" value={distPid} onChange={e => setDistPid(e.target.value)} style={input} />
          <input placeholder="Distributor Address (0x...)" value={distAddr} onChange={e => setDistAddr(e.target.value)} style={input} />
          <button onClick={transferToDistributor} style={redBtn}>Transfer to Distributor</button>
        </div>

        {/* Retailer */}
        <div style={card}>
          <h2 style={{ color: "#ea580c" }}>3. Retailer – Receive Product</h2>
          <input placeholder="Product ID" value={retailPid} onChange={e => setRetailPid(e.target.value)} style={input} />
          <input placeholder="Retailer Address (0x...)" value={retailAddr} onChange={e => setRetailAddr(e.target.value)} style={input} />
          <button onClick={transferToRetailer} style={orangeBtn}>Transfer to Retailer</button>
        </div>

        {/* Consumer */}
        <div style={card}>
          <h2 style={{ color: "#16a34a" }}>4. Consumer – Final Sale</h2>
          <input placeholder="Product ID" value={consumerPid} onChange={e => setConsumerPid(e.target.value)} style={input} />
          <input placeholder="Consumer Address (0x...)" value={consumerAddr} onChange={e => setConsumerAddr(e.target.value)} style={input} />
          <button onClick={sellToConsumer} style={greenBtn}>Sell to Consumer</button>
        </div>

        <h2 style={{ marginTop: "60px", color: "#1e293b" }}>Live Product Tracking</h2>
        {loading && <p style={{textAlign: "center", fontSize: "20px"}}>Loading from blockchain...</p>}
        {products.length === 0 && !loading && <p style={{textAlign: "center", color: "orange", fontSize: "22px"}}>No products yet. Register one!</p>}

        {products.map(p => (
          <div key={p.id} style={productCard}>
            <h3 style={{background: "#e0e7ff", padding: "15px", borderRadius: "10px"}}>
              PRODUCT ID: <span style={{fontSize: "40px", color: "#7c3aed"}}>{p.id}</span> — {p.name}
            </h3>
            <p><strong>Status:</strong> <span style={{color: "#7c3aed"}}>{p.status}</span></p>
            <p><strong>Description:</strong> {p.desc}</p>
            <p><strong>Current Owner:</strong> {p.owner}</p>
            <p><strong>Full Trace:</strong></p>
            <div style={{background: "#f3e8ff", padding: "20px", borderRadius: "10px", fontFamily: "monospace"}}>
              {p.history.join(" → ")}
            </div>
          </div>
        ))}

        <footer style={{textAlign: "center", margin: "100px 0 20px", color: "#64748b", fontSize: "18px"}}>
          Made by Abdullah • Blockchain Assignment • Polygon Amoy Testnet • November 2025
        </footer>
      </div>
    </div>
  );
}

// Styles
const card = { background: "white", padding: "35px", borderRadius: "20px", marginBottom: "30px", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" };
const productCard = { background: "white", padding: "30px", borderRadius: "20px", margin: "25px 0", boxShadow: "0 10px 30px rgba(0,0,0,0.12)" };
const input = { width: "100%", padding: "16px", margin: "12px 0", borderRadius: "12px", border: "1px solid #94a3b8", fontSize: "18px" };
const bigButton = { padding: "20px 60px", fontSize: "24px", background: "#7c3aed", color: "white", border: "none", borderRadius: "16px", cursor: "pointer" };
const refreshBtn = { marginLeft: "15px", padding: "10px 20px", background: "#4c1d95", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" };
const purpleBtn = { padding: "16px 40px", background: "#7c3aed", color: "white", border: "none", borderRadius: "12px", cursor: "pointer", fontSize: "18px", marginTop: "10px" };
const redBtn = { ...purpleBtn, background: "#dc2626" };
const orangeBtn = { ...purpleBtn, background: "#ea580c" };
const greenBtn = { ...purpleBtn, background: "#16a34a" };

export default App;