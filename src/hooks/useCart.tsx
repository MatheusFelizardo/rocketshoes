import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart]
      const productExistOnCard = updatedCart.find(item => item.id === productId)
      const stock = await api.get<Stock>(`/stock/${productId}`)
      const productStockAmount = stock.data.amount
      const currentAmount = productExistOnCard ? productExistOnCard.amount : 0
      const amount = currentAmount + 1

      // Caso a quantidade do produto ultrapasse a quantidade possível na API, irá retornar msg de erro
      if(amount > productStockAmount ) {
        toast.error('Quantidade solicitada fora de estoque')
        return
      }

      if(productExistOnCard) {        
        productExistOnCard.amount = amount
      } else {
        const product = await api.get<Product>(`/products/${productId}`)
        const newProductToCart = { 
          ...product.data,
          amount: 1
        }
        updatedCart.push(newProductToCart)
      }

      setCart([...updatedCart])
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = [...cart]
      const productExist = updatedCart.find(item => item.id === productId)

      if(productExist) {
      const newCartWithoutRemovedProduct = updatedCart.filter(item => item.id !== productId)

      setCart([ ...newCartWithoutRemovedProduct])
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCartWithoutRemovedProduct))
      }
      else {
        toast.error('Erro na remoção do produto');
      }
      
      
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const updatedCart = [...cart]
      const foundProduct = updatedCart.find(product => product.id === productId)

      const stock = await api.get<Stock>(`/stock/${productId}`)
      const productStockAmount = stock.data.amount

      if(amount <= 0) {
        return
      }

      if (amount > productStockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      if(foundProduct) {
        foundProduct.amount = amount

        setCart([...updatedCart])
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      }

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
