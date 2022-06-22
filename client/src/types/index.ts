export interface IForm {
    addressTo: string;
    amount: string;
    keyword: string;
    message: string;
  }

 export type TransactionContextType = {
    currentAccount: string;
    connectWallet: () => void;
    handleChange: (e: React.ChangeEvent<HTMLInputElement>, name: string) => void;
    formData: IForm;
    setFormData: (data: IForm) => void;
    sendTransaction: () => void;
    isLoading: boolean;
    transactions: TrasactionData[];
  };
  
 export type TrasactionData = IForm & {
      addressFrom: string;
      timestamp: string;
  }

  export type TransactionProviderProps = {
    children: React.ReactNode;
  };