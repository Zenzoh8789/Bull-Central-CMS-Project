export type Product = {
  menuLabel: string;
  menuImage: string;
  showInMenu: number | boolean;
  menuOrder: number;
  id: string;
  name: string;
  category: string;
  image: string;
  tag: string;
  description: string;
  url: string;
};
export type Dealer = {
  id: number;
  name: string;
  location: string;
  address: string;
  about: string;
};
export type Enquiry = {
  address?: string;
  district?: string;
  name: string;
  phone: string;
  email: string;
  product: string;
  message: string;
  consent: boolean;
};
