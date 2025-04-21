export class ShippingAddress {
  constructor(
    public readonly fullName: string,
    public readonly streetAddress: string,
    public readonly city: string,
    public readonly postalCode: string,
    public readonly country: string,
    public readonly lat?: number,
    public readonly ng?: number,
  ) {
  }
}
