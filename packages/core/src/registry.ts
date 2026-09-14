declare const console: { warn(message: string): void };

export interface MDLRegistryEntryDefinition {
  type: string;
  implementation: unknown;
}

export type MDLRegistryDefinition = Record<string, MDLRegistryEntryDefinition>;

export type MDLRegistryKind<TDefinition> = Extract<keyof TDefinition, string>;

export type MDLRegistryRegistration<
  TDefinition,
  TKind extends MDLRegistryKind<TDefinition> = MDLRegistryKind<TDefinition>,
> = TKind extends MDLRegistryKind<TDefinition>
  ? {
      kind: TKind;
      type: TDefinition[TKind] extends MDLRegistryEntryDefinition
        ? TDefinition[TKind]["type"]
        : never;
      implementation: TDefinition[TKind] extends MDLRegistryEntryDefinition
        ? TDefinition[TKind]["implementation"]
        : never;
      tags?: readonly string[];
    }
  : never;

export type MDLRegistryQuery<
  TDefinition,
  TKind extends MDLRegistryKind<TDefinition> = MDLRegistryKind<TDefinition>,
> = TKind extends MDLRegistryKind<TDefinition>
  ? {
      kind: TKind;
      type: TDefinition[TKind] extends MDLRegistryEntryDefinition
        ? TDefinition[TKind]["type"]
        : never;
      tags?: string | readonly string[];
    }
  : never;

export interface MDLRegistryOptions {
  name?: string;
  onCollision?: "warn" | "error" | "replace";
  onMissing?: "undefined" | "error";
  onWarn?: (message: string) => void;
}

export interface MDLRegistryRegisterOptions {
  onCollision?: "warn" | "error" | "replace";
}

interface MDLRegistryEntry {
  kind: string;
  type: string;
  tags: string[];
  tagKey: string;
  implementation: unknown;
}

/**
 * A typed, framework-agnostic registry of implementations grouped by kind.
 *
 * Registrations are identified by kind, type, and their normalized set of
 * tags. Tagged registrations match when all their tags are present in a query;
 * the most specific matching registration wins.
 */
export class MDLRegistry<
  TDefinition extends {
    [TKind in keyof TDefinition]: MDLRegistryEntryDefinition;
  },
> {
  readonly #entries = new Map<string, MDLRegistryEntry[]>();
  readonly #name: string;
  readonly #onCollision: "warn" | "error" | "replace";
  readonly #onMissing: "undefined" | "error";
  readonly #onWarn: (message: string) => void;

  constructor(options: MDLRegistryOptions = {}) {
    this.#name = options.name ?? "Registry";
    this.#onCollision = options.onCollision ?? "warn";
    this.#onMissing = options.onMissing ?? "undefined";
    this.#onWarn = options.onWarn ?? ((message) => console.warn(message));
  }

  register<TKind extends MDLRegistryKind<TDefinition>>(
    registration: MDLRegistryRegistration<TDefinition, TKind>,
    options: MDLRegistryRegisterOptions = {},
  ): this {
    const tags = normalizeTags(registration.tags);
    const tagKey = tags.join(" ");
    const key = entryKey(registration.kind, registration.type);
    const entries = this.#entries.get(key) ?? [];
    const collision = entries.findIndex((entry) => entry.tagKey === tagKey);

    const entry: MDLRegistryEntry = {
      kind: registration.kind,
      type: registration.type,
      tags,
      tagKey,
      implementation: registration.implementation,
    };

    if (collision === -1) {
      entries.push(entry);
    } else {
      const behavior = options.onCollision ?? this.#onCollision;
      const message = `[MDL] ${this.#name}: ${describeRegistration(registration.kind, registration.type, tags)} is already registered and will be replaced.`;

      if (behavior === "error") throw new Error(message);
      if (behavior === "warn") this.#onWarn(message);
      entries[collision] = entry;
    }

    this.#entries.set(key, entries);
    return this;
  }

  registerAll(
    registrations: readonly MDLRegistryRegistration<TDefinition>[],
    options: MDLRegistryRegisterOptions = {},
  ): this {
    for (const registration of registrations) {
      this.register(registration, options);
    }
    return this;
  }

  resolve<TKind extends MDLRegistryKind<TDefinition>>(
    query: MDLRegistryQuery<TDefinition, TKind>,
  ): TDefinition[TKind]["implementation"] | undefined {
    const requestedTags = normalizeTags(
      typeof query.tags === "string" ? [query.tags] : query.tags,
    );
    const available = new Set(requestedTags);
    const matches = (this.#entries.get(entryKey(query.kind, query.type)) ?? [])
      .filter((entry) => entry.tags.every((tag) => available.has(tag)))
      .sort((left, right) => right.tags.length - left.tags.length);

    const match = matches[0];

    if (!match) {
      const message = `[MDL] ${this.#name}: nothing registered for ${describeRegistration(query.kind, query.type, requestedTags)}.`;
      if (this.#onMissing === "error") throw new Error(message);
      return undefined;
    }

    const ambiguous = matches.find(
      (candidate, index) =>
        index > 0 &&
        candidate.tags.length === match.tags.length &&
        candidate.tagKey !== match.tagKey,
    );

    if (ambiguous) {
      throw new Error(
        `[MDL] ${this.#name}: ambiguous registrations match ${describeRegistration(query.kind, query.type, requestedTags)}: tags [${match.tags.join(", ")}] and [${ambiguous.tags.join(", ")}].`,
      );
    }

    return match.implementation as TDefinition[TKind]["implementation"];
  }

  has<TKind extends MDLRegistryKind<TDefinition>>(
    query: MDLRegistryQuery<TDefinition, TKind>,
  ): boolean {
    const requestedTags = normalizeTags(
      typeof query.tags === "string" ? [query.tags] : query.tags,
    );
    const available = new Set(requestedTags);

    return (this.#entries.get(entryKey(query.kind, query.type)) ?? []).some(
      (entry) => entry.tags.every((tag) => available.has(tag)),
    );
  }

  entries(): MDLRegistryRegistration<TDefinition>[] {
    return [...this.#entries.values()].flatMap((entries) =>
      entries.map(
        (entry) =>
          ({
            kind: entry.kind,
            type: entry.type,
            implementation: entry.implementation,
            ...(entry.tags.length > 0 ? { tags: [...entry.tags] } : {}),
          }) as MDLRegistryRegistration<TDefinition>,
      ),
    );
  }

  clone(options: MDLRegistryOptions = {}): MDLRegistry<TDefinition> {
    const registry = new MDLRegistry<TDefinition>({
      name: options.name ?? this.#name,
      onCollision: options.onCollision ?? this.#onCollision,
      onMissing: options.onMissing ?? this.#onMissing,
      onWarn: options.onWarn ?? this.#onWarn,
    });

    return registry.registerAll(this.entries(), { onCollision: "replace" });
  }
}

function normalizeTags(tags: readonly string[] | undefined): string[] {
  return [...new Set(tags ?? [])].sort();
}

function entryKey(kind: string, type: string): string {
  return `${kind}\u0000${type}`;
}

function describeRegistration(kind: string, type: string, tags: readonly string[]): string {
  const registration = `kind "${kind}" and type "${type}"`;
  if (tags.length === 0) return registration;
  return `${registration} with tags [${tags.join(", ")}]`;
}
