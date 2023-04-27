import React, { useState, useEffect } from 'react';
import './App.css';
import { BigNumber, utils, Contract, providers } from 'ethers'
import Lottery from './artifacts/contracts/Lottery.sol/LotteryGame.json';

/*
kontrattaki eventler dönüş değeri gibi davranıyor. fonksiyonda emit edilen evet dinlenerek kontrattan
degerler alınıyor.
*/
function App() {

  const [currentAccount, setCurrentAccount] = useState(null);
  const [currentBalance, setCurrentBalance] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [msg, setMsg] = useState("system message");

  const [lotteries, setLotteries] = useState([]);
  const [contract, setContract] = useState(null);
  const [txId, setTxId] = useState(null);

  const checkNetwork = async () => {
    console.log("Checking network...")
    try {
      const { ethereum } = window;
      if (currentAccount && ethereum.networkVersion !== '31337') {
        setModalIsOpen(true);
        setMsg("please change network! Go localhost");
      }
    } catch (error) {
      console.log(error)
    }
    console.log("currentAccount:", currentAccount)
  }

  const switchNetwork = async () => {
    try {
      console.log('switching network...')
      const { ethereum } = window;
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x7A69' }],
      });
    } catch (error) {
      console.error(error);
    }
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });

      const ethBalanceHex = await ethereum.request({
        method: 'eth_getBalance',
        params: [accounts[0], 'latest'],
      })

      let ethBalance = utils.formatEther(BigNumber.from(ethBalanceHex));
      ethBalance = (+ethBalance).toFixed(4);
      console.log('Connected', accounts[0]);
      console.log('Balance', ethBalance);
      setCurrentAccount(accounts[0]);
      setCurrentBalance(ethBalance);

      ethereum.on('accountsChanged', async (event_accounts) => {
        setCurrentAccount(event_accounts[0]);

        const newBalance = await ethereum.request({
          method: 'eth_getBalance',
          params: [event_accounts[0], 'latest'],
        });
        ethBalance = utils.formatEther(BigNumber.from(newBalance));
        ethBalance = (+ethBalance).toFixed(4);
        setCurrentBalance(ethBalance);
      });

    } catch (error) {
      console.error(error)
    }
  }

  const participate = async (id, price) => {
    try {
      const tx = await contract.participate(id, { value: price });
      setIsLoading(true);
      const receipt = await tx.wait();
      setIsLoading(false);
      setTxId(receipt.transactionHash);

      const { ethereum } = window;
      const ethBalanceHex = await ethereum.request({
        method: 'eth_getBalance',
        params: [currentAccount, 'latest'],
      })

      let ethBalance = utils.formatEther(BigNumber.from(ethBalanceHex));
      ethBalance = (+ethBalance).toFixed(4);
      setCurrentBalance(ethBalance);
    } catch (error) {
      console.error(error);
    }
  }

  const checkEvents = async () => {
    const { ethereum } = window;
    const provider = new providers.Web3Provider(ethereum);
    let lotteryContract = new Contract(Lottery.address, Lottery.abi, provider);

    lotteryContract.on("LotteryCreated", (id, ticketPrice, prize, date) => {
      console.log("transfer event was emmited");
      console.log("id:", id.toString());
      console.log("ticketprice:", ticketPrice.toString());
      console.log("prize:", prize.toString());
      console.log("enddate:", new Date(date * 1000).toISOString());
    })
  }

  useEffect(() => {
    checkNetwork()
    checkEvents()

    const { ethereum } = window;
    console.log("Change in account", currentAccount);
    ethereum.on('chainChanged', async (chainId) => {
      if (currentAccount !== null) {
        const newBalance = await ethereum.request({
          method: 'eth_getBalance',
          params: [currentAccount, 'latest'],
        });
        let ethBalance = utils.formatEther(BigNumber.from(newBalance));
        ethBalance = (+ethBalance).toFixed(4);
        setCurrentBalance(ethBalance);
      } else {
        console.log("No account");
      }
    });

    try {
      const lotarray = [{ id: 1, ticketprice: "0100000000000000000", prize: "0000000000000000000" }, { id: 2, ticketprice: "0100000000000000000", prize: "0900000000000000000" }, { id: 3, ticketprice: "0100000000000000000", prize: "0000000000000000000" }]
      setLotteries(lotarray);

      const { ethereum } = window;
      const provider = new providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      if (!contract) {
        const lotteryContract = new Contract(Lottery.address, Lottery.abi, signer);
        setContract(lotteryContract);
        console.log(lotteryContract);
      }
    } catch (error) {
      console.error(error);
    }
  }, [currentAccount, txId])

  return (
    <div className="App">
      <header className="App-header">
        <div>
          {!currentAccount ? (
            <button onClick={connectWallet}>Connect Wallet</button>)
            : (<p>
              {currentAccount.slice(0, 6)}...{currentAccount.slice(currentAccount.length - 4, currentAccount.length)} ({currentBalance} ETH)
            </p>)
          }
        </div>
        <div>
          {lotteries.length === 0
            ? <h1 className="text-white text-2xl">No available lotteries</h1>
            : lotteries.map((lottery, index) => (
              <div key={lottery.id} style={{ border: '2px solid #eee', padding: '6px', display: 'inline-block', margin: '6px' }}>
                <div>
                  <p>Prize</p>
                  <small>{utils.formatEther(BigNumber.from(lottery.prize))} ETH</small>
                </div>
                <div>
                  <p>Ticket Price</p>
                  <small>{utils.formatEther(BigNumber.from(lottery.ticketprice))} ETH</small>
                </div>
                <div>
                  <button onClick={() => { participate(lottery.id, lottery.ticketprice) }}>
                    Participate
                  </button>
                </div>
              </div>
            ))}
        </div>

        isLoading: {isLoading}
      </header>
    </div>
  );
}

export default App;