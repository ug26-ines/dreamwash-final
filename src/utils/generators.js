export const genOrderId = () => {
  const d    = new Date();
  const yymm = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0');
  const seq  = Math.floor(1000 + Math.random() * 9000);
  return `DWO-${yymm}-${seq}`;
};

export const genWarrantNum = () => `DWW-${Math.floor(1000 + Math.random() * 9000)}`;

export const genClientId = () => `DXW-${Math.floor(10000 + Math.random() * 90000)}`;
