export interface VendorConfig {
  description: string;
  logo: string;
  banner: string;
  invertLogo?: boolean;
}

export interface Vendor {
  id: string;
  name: string;
  code: string;
  description: string;
  logo: string;
  banner: string;
  invertLogo: boolean;
}
