import React, { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [tableNumber, setTableNumber] = useState(null);

  // Add item to cart
  const addToCart = (item, notes = '') => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((i) => i.menuItem._id === item._id);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += 1;
        if (notes) updated[existingIndex].notes = notes;
        return updated;
      } else {
        return [...prevCart, { menuItem: item, quantity: 1, notes }];
      }
    });
  };

  // Update item quantity
  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((i) =>
        i.menuItem._id === itemId ? { ...i, quantity } : i
      )
    );
  };

  // Remove item from cart
  const removeFromCart = (itemId) => {
    setCart((prevCart) => prevCart.filter((i) => i.menuItem._id !== itemId));
  };

  // Clear entire cart
  const clearCart = () => {
    setCart([]);
  };

  // Total amount calculation
  const totalAmount = cart.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0
  );

  // Total items count calculation
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        tableNumber,
        setTableNumber,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalAmount,
        totalCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
