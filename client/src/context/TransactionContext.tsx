import React, { useEffect, useState } from "react";
import { ethers, utils } from "ethers";
import { contractABI, contractAddress } from "../utils/constants";
import {
  IForm,
  TransactionContextType,
  TrasactionData,
  TransactionProviderProps,
} from "../types";

declare var window: any;

export const TransactionContext = React.createContext(
  {} as TransactionContextType
);

const { ethereum } = window;

const getEthereumContract = () => {
  const provider = new ethers.providers.Web3Provider(ethereum);
  const signer = provider.getSigner();
  return new ethers.Contract(contractAddress, contractABI, signer);
};

export const TransactionProvider = ({ children }: TransactionProviderProps) => {
  const [currentAccount, setCurrentAccount] = useState<string>("");
  const [formData, setFormData] = useState<IForm>({
    addressTo: "",
    amount: "",
    keyword: "",
    message: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [transactionCount, setTransactionCount] = useState<string | null>(
    localStorage.getItem("transactionCount")
  );
  const [transactions, setTransactions] = useState<TrasactionData[]>([]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    name: string
  ) => {
    setFormData({ ...formData, [name]: e.target.value });
  };

  const getAllTransactions = async () => {
    try {
      if (!ethereum) return alert("Please install metamask!");
      const contract = getEthereumContract();
      const availableTransactions = await contract.getAllTransactions();
      const structuredTransactions = availableTransactions.map(
        (transaction: any) => ({
          addressTo: transaction.receiver,
          addressFrom: transaction.sender,
          timestamp: new Date(
            transaction.timestamp.toNumber() * 1000
          ).toLocaleString(),
          message: transaction.message,
          keyword: transaction.keyword,
          amount: parseInt(transaction.amount._hex) / 10 ** 18,
        })
      );

      console.log(structuredTransactions);

      setTransactions(structuredTransactions);
    } catch (error) {
      console.log(error);
    }
  };

  const checkIsWalletConnected = async () => {
    try {
      if (!ethereum) return alert("Please install metamask!");
      const accounts = await ethereum.request({ method: "eth_accounts" });
      if (accounts.length) {
        setCurrentAccount(accounts[0]);
        console.log(accounts[0]);
        getAllTransactions();
      } else {
        alert("Please connect metamask!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const checkIfTransactinExist = async () => {
    try {
      const transactionsContract = getEthereumContract();
      const transactionsCount = await transactionsContract.getTransactionCount();
      setTransactionCount(transactionsCount);
      localStorage.setItem("transactionCount", transactionsCount);
    } catch (error) {
      console.log(error);
    }
  };

  const connectWallet = async () => {
    try {
      if (!ethereum) return alert("Please install metamask!");
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
      throw new Error("no ethereum object");
    }
  };

  const sendTransaction = async () => {
    try {
      if (!ethereum) return alert("Please install metamask!");
      const { addressTo, amount, keyword, message } = formData;
      const contract = getEthereumContract();
      const parsedAmount = utils.parseEther(amount);
      await ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: currentAccount,
            to: addressTo,
            gas: "0x5208", // 21000 gwei
            value: parsedAmount._hex, // 0.00001 ether
          },
        ],
      });
      const transactionHash = await contract.addToBlockchain(
        addressTo,
        parsedAmount,
        message,
        keyword
      );
      setIsLoading(true);
      console.log(`Loading...: ${transactionHash}`);
      await transactionHash.wait();
      setIsLoading(false);
      console.log(`Transaction completed: ${transactionHash}`);

      const transactionsCount = await contract.getTransactionCount();
      setTransactionCount(transactionsCount.toNumber());
      window.reload();
    } catch (error) {
      console.log(error);
      throw new Error("no ethereum object");
    }
  };

  useEffect(() => {
    checkIsWalletConnected();
    checkIfTransactinExist();
  }, [transactionCount]);

  return (
    <TransactionContext.Provider
      value={{
        currentAccount,
        connectWallet,
        handleChange,
        formData,
        setFormData,
        sendTransaction,
        isLoading,
        transactions,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};
