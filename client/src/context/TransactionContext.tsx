import React, { useEffect, useState } from "react";
import { ethers, utils } from "ethers";
import { contractABI, contractAddress } from "../utils/constants";
import { IForm } from "../types";

declare var window: any;

type TransactionContextType = {
  currentAccount: string;
  connectWallet: () => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>, name: string) => void;
  formData: IForm;
  setFormData: (data: IForm) => void;
  sendTransaction: () => void;
  // getEthereumContract: () => ethers.Contract;
};

export const TransactionContext = React.createContext(
  {} as TransactionContextType
);

const { ethereum } = window;

const getEthereumContract = () => {
  const provider = new ethers.providers.Web3Provider(ethereum);
  const signer = provider.getSigner();
  return new ethers.Contract(contractAddress, contractABI, signer);
};

type TransactionProviderProps = {
  children: React.ReactNode;
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    name: string
  ) => {
    setFormData({ ...formData, [name]: e.target.value });
  };

  const checkIsWalletConnected = async () => {
    try {
      if (!ethereum) return alert("Please install metamask!");
      const accounts = await ethereum.request({ method: "eth_accounts" });
      if (accounts.length) {
        setCurrentAccount(accounts[0]);
        console.log(accounts[0]);
      } else {
        alert("Please connect metamask!");
      }
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
    } catch (error) {
      console.log(error);
      throw new Error("no ethereum object");
    }
  };

  useEffect(() => {
    checkIsWalletConnected();
  }, []);

  return (
    <TransactionContext.Provider
      value={{
        currentAccount,
        connectWallet,
        handleChange,
        formData,
        setFormData,
        sendTransaction,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};
