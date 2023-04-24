/**
 * @author Jörn Heinemann <joernheinemann@gmx.de>
 * @since 2022/07/16
 */

export type InitReturn = {
	status: boolean, 	//if this store is supported
	err?: string	//if not supported -> explain why (e.g. Indexeddb not supported)
	warn?: string	//this store can be use but with drawbacks (e.g. MemoryStore not for large files or localStore not for files in general)
}

export interface StorageInterface
{
	init(): Promise<InitReturn>;

	getDownloadUrl(): Promise<string>;

	cleanStorage(): Promise<void>;

	storePart(chunk: ArrayBuffer): Promise<void>;

	delete(key: string): Promise<void>;

	getItem<T>(key: string): Promise<T | undefined>;

	set<T>(key: string, item: T): Promise<void | any>;
}