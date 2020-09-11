declare module "ember-cookies/services/cookies" {
  import Service from "@ember/service";

  type ReadOptions = {
    raw?: boolean;
    domain?: never;
    expires?: never;
    maxAge?: never;
    path?: never;
  };

  type WriteOptions = {
    domain?: string;
    path?: string;
    secure?: boolean;
    raw?: boolean;
    sameSite?: "Strict" | "Lax" | "None";
    signed?: never;
  } & (
    | { expires?: Date; maxAge?: never }
    | { maxAge?: number; expires?: never }
  );

  type ClearOptions = {
    domain?: string;
    path?: string;
    secure?: boolean;

    expires?: never;
    maxAge?: never;
    raw?: never;
  };

  export default class CookiesService extends Service {
    public read(name: string, options?: ReadOptions): string;
    public write(name: string, value: unknown, options?: WriteOptions): void;
    public clear(name: string, options?: ClearOptions): void;
    public exists(name: string): boolean;
  }
}
