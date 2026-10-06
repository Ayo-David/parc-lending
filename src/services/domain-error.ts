/** An expected business rejection; the HTTP layer maps it to 422. */
export class DomainError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}
