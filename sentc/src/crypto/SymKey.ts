import {CryptoRawOutput, USER_KEY_STORAGE_NAMES} from "../Enities";
import {
	decrypt_raw_symmetric,
	decrypt_string_symmetric,
	decrypt_symmetric,
	done_fetch_sym_key,
	done_fetch_sym_key_by_private_key,
	encrypt_raw_symmetric,
	encrypt_string_symmetric,
	encrypt_symmetric
} from "sentc_wasm";
import {Sentc} from "../Sentc";
import {make_req, HttpMethod} from "@sentclose/sentc-common";

export async function fetchSymKeyByPrivateKey(base_url:string, app_token: string, key_id: string, master_key: string, master_key_id: string, sign_key: string): Promise<SymKey>
{
	const cache_key = USER_KEY_STORAGE_NAMES.sym_key + "_id_" + key_id;

	const storage = await Sentc.getStore();
	const sym_key_raw: string | undefined = await storage.getItem(cache_key);

	if (sym_key_raw) {
		return new SymKey(base_url, app_token, sym_key_raw, key_id, master_key_id, sign_key);
	}

	const res = await make_req(HttpMethod.GET, base_url + "/api/v1/keys/sym_key/" + key_id, app_token);

	const key_out = done_fetch_sym_key_by_private_key(master_key, res, false);

	const sym_key = new SymKey(base_url, app_token, key_out, key_id, master_key_id, sign_key);

	await storage.set(cache_key, key_out);

	return sym_key;
}

export function getNonRegisteredKey(master_key: string, key: string, master_key_id: string, sign_key: string)
{
	const key_out = done_fetch_sym_key(master_key, key, true);

	return new SymKey("", "", key_out, "non_register", master_key_id, sign_key);
}

export function getNonRegisteredKeyByPrivateKey(private_key: string, key: string, master_key_id: string, sign_key: string)
{
	const key_out = done_fetch_sym_key_by_private_key(private_key, key, true);

	return new SymKey("", "", key_out, "non_register", master_key_id, sign_key);
}

export class SymKey
{
	constructor(
		public base_url:string,
		public app_token: string,
		public key: string,
		public key_id: string,
		public master_key_id: string,	//this is important to save it to decrypt this key later
		private sign_key: string
	) {

	}

	public encryptRaw(data: Uint8Array): CryptoRawOutput;

	public encryptRaw(data: Uint8Array, sign: true): CryptoRawOutput;

	public encryptRaw(data: Uint8Array, sign = false): CryptoRawOutput
	{
		let sign_key: string | undefined;

		if (sign) {
			sign_key = this.sign_key;
		}

		const out = encrypt_raw_symmetric(this.key, data, sign_key);

		return {
			head: out.get_head(),
			data: out.get_data()
		};
	}

	public decryptRaw(head: string, encrypted_data: Uint8Array): Uint8Array;

	public decryptRaw(head: string, encrypted_data: Uint8Array, verify_key: string): Uint8Array;

	public decryptRaw(head: string, encrypted_data: Uint8Array, verify_key?: string): Uint8Array
	{
		return decrypt_raw_symmetric(this.key, encrypted_data, head, verify_key);
	}

	//__________________________________________________________________________________________________________________

	public encrypt(data: Uint8Array): Uint8Array

	public encrypt(data: Uint8Array, sign: true): Uint8Array

	public encrypt(data: Uint8Array, sign = false): Uint8Array
	{
		let sign_key: string | undefined;

		if (sign) {
			sign_key = this.sign_key;
		}

		return encrypt_symmetric(this.key, data, sign_key);
	}

	public decrypt(data: Uint8Array): Uint8Array;

	public decrypt(data: Uint8Array, verify_key: string): Uint8Array;

	public decrypt(data: Uint8Array, verify_key?: string): Uint8Array
	{
		return decrypt_symmetric(this.key, data, verify_key);
	}

	//__________________________________________________________________________________________________________________

	public encryptString(data: string): string;

	public encryptString(data: string, sign: true): string;

	public encryptString(data: string, sign = false): string
	{
		let sign_key: string | undefined;

		if (sign) {
			sign_key = this.sign_key;
		}

		return encrypt_string_symmetric(this.key, data, sign_key);
	}

	public decryptString(data: string): string;

	public decryptString(data: string, verify_key: string): string;

	public decryptString(data: string, verify_key?: string): string
	{
		return decrypt_string_symmetric(this.key, data, verify_key);
	}
}