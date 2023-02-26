import React, { useState, useEffect } from 'react'
import { newKitFromWeb3 } from '@celo/contractkit'
import BigNumber from "bignumber.js";
import Web3 from 'web3';
import erc20ABI from "./contracts/erc20-abi.json"
import buyCoffeeABI from "./contracts/buy-coffee-abi.json"
import coffeeCupImage from "./images/buy-coffee-coffee-cup.jpg"
import "./App.css"

const buyCoffeeAddress = ""
const cUsdAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";
const ERC20_DECIMALS = 18;

const App = () => {
  const [kit, setKit] = useState(null)
  const [balance, setBalance] = useState(null)
  const [address, setAddress] = useState(null)
  const [buyerName, setBuyerName] = useState(null)
  const [buyerAmount, setBuyerAmount] = useState(null)
  const [buyerMessage, setBuyerMessage] = useState(null)
  const [contract, setContract] = useState(null)
  const [coffee, setCoffee] = useState([])

  useEffect(() => {
    connectWallet()
  }, [])

  useEffect(() => {
    if (kit && address) {
      getBalance()
    }
  }, [kit, address])

  useEffect(() => {
    if (contract) {
      getCoffee()
    }
  })

  const connectWallet = async () => {
    if (window.celo) {
      try {
        await window.celo.enable();
        const web3 = new Web3(window.celo);
        let kit = newKitFromWeb3(web3)

        const acc = await kit.web3.eth.getAccounts();
        const acc0 = acc[0];
        kit.defaultAccount = acc0;
        setKit(kit)
        setAddress(acc)
      } catch (e) {
        console.log(e)
      }
    } else {
      alert("Please install CeloExtensionWallet to continue with this app")
    }
  }

  const getBalance = async () => {
    try {
      const bal = await kit.getTotalBalance(String(address));
      const cUsdBalance = bal.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2)
      const buyCoffeeContract = new kit.web3.eth.Contract(buyCoffeeABI, buyCoffeeAddress);

      setContract(buyCoffeeContract)
      setBalance(cUsdBalance)
    } catch (e) {
      console.log(e)
    }
  }

  const getCoffee = async () => {
    try {
      const data = await contract.methods.getCoffeeBuyers().call();
      const coffeeList = await Promise.all(
        data.map(coffee => {
          return {
            name: coffee.name,
            message: coffee.message,
            buyer: coffee.buyer,
            amount: coffee.amount,
            timestamp: coffee.timestamp
          }
        })
      )
      setCoffee(coffeeList)
    } catch (e) {
      console.log(e)
    }
  }

  const approvePayment = async (_amount) => {
    const cUsdContract = new kit.web3.eth.Contract(
      erc20ABI,
      cUsdAddress
    )
    await cUsdContract.methods
      .approve(buyCoffeeAddress, _amount)
      .send({ from: kit.defaultAccount })
  }

  const purchase = async () => {
    const amount = new BigNumber(buyerAmount).shiftedBy(ERC20_DECIMALS).toString()
    try {
      await approvePayment(amount);
      await contract.methods.purchaseCoffee(
        buyerMessage,
        buyerName,
        amount
      ).send({from: kit.defaultAccount})
    } catch (e) {
      console.log(e)
    }
  }

  return (
    <div className="app_section">
      <div className="wallet-section">
        <div className="wallet-address">{address}</div>
        <div className="wallet-balance">{balance} cUSD</div>
      </div>
      <div className="main-section">
        <div className="purchase-coffee-section">
          <img src={coffeeCupImage} />
          <p>Buy me a coffee</p>
          <div className="coffee-form">
            <input className="field name-field" placeholder="Enter your name please" type="text" value={buyerName} onChange={e => setBuyerName(e.target.value)} />
            <textarea className="field message-field" placeholder="Enter the message you have for me" value={buyerMessage} onChange={e => setBuyerMessage(e.target.value)} />
            <input className="field amount-field" placeholder="Enter amount of coffee you want to purchase for me" type="number" value={buyerAmount} onChange={e => setBuyerAmount(e.target.value)} />
            <button className="form-button" onClick={purchase}>Buy</button>
          </div>
        </div>
        <hr />
        <div className="ls-coffee-section">
          <p>Coffee purchased so far...</p>
          {coffee.map(item => (
            <div className="coffee-item">
              <div className="coffee-text"><a href={`https://explorer.celo.org/alfajores/address/${item.buyer}/`}>{item.name.toLowerCase()}</a> purchased <span className="coffee-amount">{new BigNumber(item.amount).shiftedBy(-ERC20_DECIMALS).toString()}</span> coffee for you with the message: </div>
              <div className="coffee-message">{item.message}</div>
              <div className="coffee-time">{new Date(Number(item.timestamp * 1000)).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default App