/* eslint-disable */

import { AllTypesProps, ReturnTypes, Ops } from './const';
export const HOST = "http://10.1.28.48:4002/graphql"


export const HEADERS = {}
export const apiSubscription = (options: chainOptions) => (query: string) => {
  try {
    const queryString = options[0] + '?query=' + encodeURIComponent(query);
    const wsString = queryString.replace('http', 'ws');
    const host = (options.length > 1 && options[1]?.websocket?.[0]) || wsString;
    const webSocketOptions = options[1]?.websocket || [host];
    const ws = new WebSocket(...webSocketOptions);
    return {
      ws,
      on: (e: (args: any) => void) => {
        ws.onmessage = (event: any) => {
          if (event.data) {
            const parsed = JSON.parse(event.data);
            const data = parsed.data;
            return e(data);
          }
        };
      },
      off: (e: (args: any) => void) => {
        ws.onclose = e;
      },
      error: (e: (args: any) => void) => {
        ws.onerror = e;
      },
      open: (e: () => void) => {
        ws.onopen = e;
      },
    };
  } catch {
    throw new Error('No websockets implemented');
  }
};
const handleFetchResponse = (response: Response): Promise<GraphQLResponse> => {
  if (!response.ok) {
    return new Promise((_, reject) => {
      response
        .text()
        .then((text) => {
          try {
            reject(JSON.parse(text));
          } catch (err) {
            reject(text);
          }
        })
        .catch(reject);
    });
  }
  return response.json() as Promise<GraphQLResponse>;
};

export const apiFetch =
  (options: fetchOptions) =>
  (query: string, variables: Record<string, unknown> = {}) => {
    const fetchOptions = options[1] || {};
    if (fetchOptions.method && fetchOptions.method === 'GET') {
      return fetch(`${options[0]}?query=${encodeURIComponent(query)}`, fetchOptions)
        .then(handleFetchResponse)
        .then((response: GraphQLResponse) => {
          if (response.errors) {
            throw new GraphQLError(response);
          }
          return response.data;
        });
    }
    return fetch(`${options[0]}`, {
      body: JSON.stringify({ query, variables }),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      ...fetchOptions,
    })
      .then(handleFetchResponse)
      .then((response: GraphQLResponse) => {
        if (response.errors) {
          throw new GraphQLError(response);
        }
        return response.data;
      });
  };

export const InternalsBuildQuery = ({
  ops,
  props,
  returns,
  options,
  scalars,
}: {
  props: AllTypesPropsType;
  returns: ReturnTypesType;
  ops: Operations;
  options?: OperationOptions;
  scalars?: ScalarDefinition;
}) => {
  const ibb = (
    k: string,
    o: InputValueType | VType,
    p = '',
    root = true,
    vars: Array<{ name: string; graphQLType: string }> = [],
  ): string => {
    const keyForPath = purifyGraphQLKey(k);
    const newPath = [p, keyForPath].join(SEPARATOR);
    if (!o) {
      return '';
    }
    if (typeof o === 'boolean' || typeof o === 'number') {
      return k;
    }
    if (typeof o === 'string') {
      return `${k} ${o}`;
    }
    if (Array.isArray(o)) {
      const args = InternalArgsBuilt({
        props,
        returns,
        ops,
        scalars,
        vars,
      })(o[0], newPath);
      return `${ibb(args ? `${k}(${args})` : k, o[1], p, false, vars)}`;
    }
    if (k === '__alias') {
      return Object.entries(o)
        .map(([alias, objectUnderAlias]) => {
          if (typeof objectUnderAlias !== 'object' || Array.isArray(objectUnderAlias)) {
            throw new Error(
              'Invalid alias it should be __alias:{ YOUR_ALIAS_NAME: { OPERATION_NAME: { ...selectors }}}',
            );
          }
          const operationName = Object.keys(objectUnderAlias)[0];
          const operation = objectUnderAlias[operationName];
          return ibb(`${alias}:${operationName}`, operation, p, false, vars);
        })
        .join('\n');
    }
    const hasOperationName = root && options?.operationName ? ' ' + options.operationName : '';
    const keyForDirectives = o.__directives ?? '';
    const query = `{${Object.entries(o)
      .filter(([k]) => k !== '__directives')
      .map((e) => ibb(...e, [p, `field<>${keyForPath}`].join(SEPARATOR), false, vars))
      .join('\n')}}`;
    if (!root) {
      return `${k} ${keyForDirectives}${hasOperationName} ${query}`;
    }
    const varsString = vars.map((v) => `${v.name}: ${v.graphQLType}`).join(', ');
    return `${k} ${keyForDirectives}${hasOperationName}${varsString ? `(${varsString})` : ''} ${query}`;
  };
  return ibb;
};

type UnionOverrideKeys<T, U> = Omit<T, keyof U> & U;

export const Thunder =
  <SCLR extends ScalarDefinition>(fn: FetchFunction, thunderGraphQLOptions?: ThunderGraphQLOptions<SCLR>) =>
  <O extends keyof typeof Ops, OVERRIDESCLR extends SCLR, R extends keyof ValueTypes = GenericOperation<O>>(
    operation: O,
    graphqlOptions?: ThunderGraphQLOptions<OVERRIDESCLR>,
  ) =>
  <Z extends ValueTypes[R]>(
    o: Z & {
      [P in keyof Z]: P extends keyof ValueTypes[R] ? Z[P] : never;
    },
    ops?: OperationOptions & { variables?: Record<string, unknown> },
  ) => {
    const options = {
      ...thunderGraphQLOptions,
      ...graphqlOptions,
    };
    return fn(
      Zeus(operation, o, {
        operationOptions: ops,
        scalars: options?.scalars,
      }),
      ops?.variables,
    ).then((data) => {
      if (options?.scalars) {
        return decodeScalarsInResponse({
          response: data,
          initialOp: operation,
          initialZeusQuery: o as VType,
          returns: ReturnTypes,
          scalars: options.scalars,
          ops: Ops,
        });
      }
      return data;
    }) as Promise<InputType<GraphQLTypes[R], Z, UnionOverrideKeys<SCLR, OVERRIDESCLR>>>;
  };

export const Chain = (...options: chainOptions) => Thunder(apiFetch(options));

export const SubscriptionThunder =
  <SCLR extends ScalarDefinition>(fn: SubscriptionFunction, thunderGraphQLOptions?: ThunderGraphQLOptions<SCLR>) =>
  <O extends keyof typeof Ops, OVERRIDESCLR extends SCLR, R extends keyof ValueTypes = GenericOperation<O>>(
    operation: O,
    graphqlOptions?: ThunderGraphQLOptions<OVERRIDESCLR>,
  ) =>
  <Z extends ValueTypes[R]>(
    o: Z & {
      [P in keyof Z]: P extends keyof ValueTypes[R] ? Z[P] : never;
    },
    ops?: OperationOptions & { variables?: ExtractVariables<Z> },
  ) => {
    const options = {
      ...thunderGraphQLOptions,
      ...graphqlOptions,
    };
    type CombinedSCLR = UnionOverrideKeys<SCLR, OVERRIDESCLR>;
    const returnedFunction = fn(
      Zeus(operation, o, {
        operationOptions: ops,
        scalars: options?.scalars,
      }),
    ) as SubscriptionToGraphQL<Z, GraphQLTypes[R], CombinedSCLR>;
    if (returnedFunction?.on && options?.scalars) {
      const wrapped = returnedFunction.on;
      returnedFunction.on = (fnToCall: (args: InputType<GraphQLTypes[R], Z, CombinedSCLR>) => void) =>
        wrapped((data: InputType<GraphQLTypes[R], Z, CombinedSCLR>) => {
          if (options?.scalars) {
            return fnToCall(
              decodeScalarsInResponse({
                response: data,
                initialOp: operation,
                initialZeusQuery: o as VType,
                returns: ReturnTypes,
                scalars: options.scalars,
                ops: Ops,
              }),
            );
          }
          return fnToCall(data);
        });
    }
    return returnedFunction;
  };

export const Subscription = (...options: chainOptions) => SubscriptionThunder(apiSubscription(options));
export const Zeus = <
  Z extends ValueTypes[R],
  O extends keyof typeof Ops,
  R extends keyof ValueTypes = GenericOperation<O>,
>(
  operation: O,
  o: Z,
  ops?: {
    operationOptions?: OperationOptions;
    scalars?: ScalarDefinition;
  },
) =>
  InternalsBuildQuery({
    props: AllTypesProps,
    returns: ReturnTypes,
    ops: Ops,
    options: ops?.operationOptions,
    scalars: ops?.scalars,
  })(operation, o as VType);

export const ZeusSelect = <T>() => ((t: unknown) => t) as SelectionFunction<T>;

export const Selector = <T extends keyof ValueTypes>(key: T) => key && ZeusSelect<ValueTypes[T]>();

export const TypeFromSelector = <T extends keyof ValueTypes>(key: T) => key && ZeusSelect<ValueTypes[T]>();
export const Gql = Chain(HOST, {
  headers: {
    'Content-Type': 'application/json',
    ...HEADERS,
  },
});

export const ZeusScalars = ZeusSelect<ScalarCoders>();

type ScalarsSelector<T> = {
  [X in Required<{
    [P in keyof T]: T[P] extends number | string | undefined | boolean ? P : never;
  }>[keyof T]]: true;
};

export const fields = <T extends keyof ModelTypes>(k: T) => {
  const t = ReturnTypes[k];
  const o = Object.fromEntries(
    Object.entries(t)
      .filter(([, value]) => {
        const isReturnType = ReturnTypes[value as string];
        if (!isReturnType || (typeof isReturnType === 'string' && isReturnType.startsWith('scalar.'))) {
          return true;
        }
      })
      .map(([key]) => [key, true as const]),
  );
  return o as ScalarsSelector<ModelTypes[T]>;
};

export const decodeScalarsInResponse = <O extends Operations>({
  response,
  scalars,
  returns,
  ops,
  initialZeusQuery,
  initialOp,
}: {
  ops: O;
  response: any;
  returns: ReturnTypesType;
  scalars?: Record<string, ScalarResolver | undefined>;
  initialOp: keyof O;
  initialZeusQuery: InputValueType | VType;
}) => {
  if (!scalars) {
    return response;
  }
  const builder = PrepareScalarPaths({
    ops,
    returns,
  });

  const scalarPaths = builder(initialOp as string, ops[initialOp], initialZeusQuery);
  if (scalarPaths) {
    const r = traverseResponse({ scalarPaths, resolvers: scalars })(initialOp as string, response, [ops[initialOp]]);
    return r;
  }
  return response;
};

export const traverseResponse = ({
  resolvers,
  scalarPaths,
}: {
  scalarPaths: { [x: string]: `scalar.${string}` };
  resolvers: {
    [x: string]: ScalarResolver | undefined;
  };
}) => {
  const ibb = (k: string, o: InputValueType | VType, p: string[] = []): unknown => {
    if (Array.isArray(o)) {
      return o.map((eachO) => ibb(k, eachO, p));
    }
    if (o == null) {
      return o;
    }
    const scalarPathString = p.join(SEPARATOR);
    const currentScalarString = scalarPaths[scalarPathString];
    if (currentScalarString) {
      const currentDecoder = resolvers[currentScalarString.split('.')[1]]?.decode;
      if (currentDecoder) {
        return currentDecoder(o);
      }
    }
    if (typeof o === 'boolean' || typeof o === 'number' || typeof o === 'string' || !o) {
      return o;
    }
    const entries = Object.entries(o).map(([k, v]) => [k, ibb(k, v, [...p, purifyGraphQLKey(k)])] as const);
    const objectFromEntries = entries.reduce<Record<string, unknown>>((a, [k, v]) => {
      a[k] = v;
      return a;
    }, {});
    return objectFromEntries;
  };
  return ibb;
};

export type AllTypesPropsType = {
  [x: string]:
    | undefined
    | `scalar.${string}`
    | 'enum'
    | {
        [x: string]:
          | undefined
          | string
          | {
              [x: string]: string | undefined;
            };
      };
};

export type ReturnTypesType = {
  [x: string]:
    | {
        [x: string]: string | undefined;
      }
    | `scalar.${string}`
    | undefined;
};
export type InputValueType = {
  [x: string]: undefined | boolean | string | number | [any, undefined | boolean | InputValueType] | InputValueType;
};
export type VType =
  | undefined
  | boolean
  | string
  | number
  | [any, undefined | boolean | InputValueType]
  | InputValueType;

export type PlainType = boolean | number | string | null | undefined;
export type ZeusArgsType =
  | PlainType
  | {
      [x: string]: ZeusArgsType;
    }
  | Array<ZeusArgsType>;

export type Operations = Record<string, string>;

export type VariableDefinition = {
  [x: string]: unknown;
};

export const SEPARATOR = '|';

export type fetchOptions = Parameters<typeof fetch>;
type websocketOptions = typeof WebSocket extends new (...args: infer R) => WebSocket ? R : never;
export type chainOptions = [fetchOptions[0], fetchOptions[1] & { websocket?: websocketOptions }] | [fetchOptions[0]];
export type FetchFunction = (query: string, variables?: Record<string, unknown>) => Promise<any>;
export type SubscriptionFunction = (query: string) => any;
type NotUndefined<T> = T extends undefined ? never : T;
export type ResolverType<F> = NotUndefined<F extends [infer ARGS, any] ? ARGS : undefined>;

export type OperationOptions = {
  operationName?: string;
};

export type ScalarCoder = Record<string, (s: unknown) => string>;

export interface GraphQLResponse {
  data?: Record<string, any>;
  errors?: Array<{
    message: string;
  }>;
}
export class GraphQLError extends Error {
  constructor(public response: GraphQLResponse) {
    super('');
    console.error(response);
  }
  toString() {
    return 'GraphQL Response Error';
  }
}
export type GenericOperation<O> = O extends keyof typeof Ops ? typeof Ops[O] : never;
export type ThunderGraphQLOptions<SCLR extends ScalarDefinition> = {
  scalars?: SCLR | ScalarCoders;
};

const ExtractScalar = (mappedParts: string[], returns: ReturnTypesType): `scalar.${string}` | undefined => {
  if (mappedParts.length === 0) {
    return;
  }
  const oKey = mappedParts[0];
  const returnP1 = returns[oKey];
  if (typeof returnP1 === 'object') {
    const returnP2 = returnP1[mappedParts[1]];
    if (returnP2) {
      return ExtractScalar([returnP2, ...mappedParts.slice(2)], returns);
    }
    return undefined;
  }
  return returnP1 as `scalar.${string}` | undefined;
};

export const PrepareScalarPaths = ({ ops, returns }: { returns: ReturnTypesType; ops: Operations }) => {
  const ibb = (
    k: string,
    originalKey: string,
    o: InputValueType | VType,
    p: string[] = [],
    pOriginals: string[] = [],
    root = true,
  ): { [x: string]: `scalar.${string}` } | undefined => {
    if (!o) {
      return;
    }
    if (typeof o === 'boolean' || typeof o === 'number' || typeof o === 'string') {
      const extractionArray = [...pOriginals, originalKey];
      const isScalar = ExtractScalar(extractionArray, returns);
      if (isScalar?.startsWith('scalar')) {
        const partOfTree = {
          [[...p, k].join(SEPARATOR)]: isScalar,
        };
        return partOfTree;
      }
      return {};
    }
    if (Array.isArray(o)) {
      return ibb(k, k, o[1], p, pOriginals, false);
    }
    if (k === '__alias') {
      return Object.entries(o)
        .map(([alias, objectUnderAlias]) => {
          if (typeof objectUnderAlias !== 'object' || Array.isArray(objectUnderAlias)) {
            throw new Error(
              'Invalid alias it should be __alias:{ YOUR_ALIAS_NAME: { OPERATION_NAME: { ...selectors }}}',
            );
          }
          const operationName = Object.keys(objectUnderAlias)[0];
          const operation = objectUnderAlias[operationName];
          return ibb(alias, operationName, operation, p, pOriginals, false);
        })
        .reduce((a, b) => ({
          ...a,
          ...b,
        }));
    }
    const keyName = root ? ops[k] : k;
    return Object.entries(o)
      .filter(([k]) => k !== '__directives')
      .map(([k, v]) => {
        // Inline fragments shouldn't be added to the path as they aren't a field
        const isInlineFragment = originalKey.match(/^...\s*on/) != null;
        return ibb(
          k,
          k,
          v,
          isInlineFragment ? p : [...p, purifyGraphQLKey(keyName || k)],
          isInlineFragment ? pOriginals : [...pOriginals, purifyGraphQLKey(originalKey)],
          false,
        );
      })
      .reduce((a, b) => ({
        ...a,
        ...b,
      }));
  };
  return ibb;
};

export const purifyGraphQLKey = (k: string) => k.replace(/\([^)]*\)/g, '').replace(/^[^:]*\:/g, '');

const mapPart = (p: string) => {
  const [isArg, isField] = p.split('<>');
  if (isField) {
    return {
      v: isField,
      __type: 'field',
    } as const;
  }
  return {
    v: isArg,
    __type: 'arg',
  } as const;
};

type Part = ReturnType<typeof mapPart>;

export const ResolveFromPath = (props: AllTypesPropsType, returns: ReturnTypesType, ops: Operations) => {
  const ResolvePropsType = (mappedParts: Part[]) => {
    const oKey = ops[mappedParts[0].v];
    const propsP1 = oKey ? props[oKey] : props[mappedParts[0].v];
    if (propsP1 === 'enum' && mappedParts.length === 1) {
      return 'enum';
    }
    if (typeof propsP1 === 'string' && propsP1.startsWith('scalar.') && mappedParts.length === 1) {
      return propsP1;
    }
    if (typeof propsP1 === 'object') {
      if (mappedParts.length < 2) {
        return 'not';
      }
      const propsP2 = propsP1[mappedParts[1].v];
      if (typeof propsP2 === 'string') {
        return rpp(
          `${propsP2}${SEPARATOR}${mappedParts
            .slice(2)
            .map((mp) => mp.v)
            .join(SEPARATOR)}`,
        );
      }
      if (typeof propsP2 === 'object') {
        if (mappedParts.length < 3) {
          return 'not';
        }
        const propsP3 = propsP2[mappedParts[2].v];
        if (propsP3 && mappedParts[2].__type === 'arg') {
          return rpp(
            `${propsP3}${SEPARATOR}${mappedParts
              .slice(3)
              .map((mp) => mp.v)
              .join(SEPARATOR)}`,
          );
        }
      }
    }
  };
  const ResolveReturnType = (mappedParts: Part[]) => {
    if (mappedParts.length === 0) {
      return 'not';
    }
    const oKey = ops[mappedParts[0].v];
    const returnP1 = oKey ? returns[oKey] : returns[mappedParts[0].v];
    if (typeof returnP1 === 'object') {
      if (mappedParts.length < 2) return 'not';
      const returnP2 = returnP1[mappedParts[1].v];
      if (returnP2) {
        return rpp(
          `${returnP2}${SEPARATOR}${mappedParts
            .slice(2)
            .map((mp) => mp.v)
            .join(SEPARATOR)}`,
        );
      }
    }
  };
  const rpp = (path: string): 'enum' | 'not' | `scalar.${string}` => {
    const parts = path.split(SEPARATOR).filter((l) => l.length > 0);
    const mappedParts = parts.map(mapPart);
    const propsP1 = ResolvePropsType(mappedParts);
    if (propsP1) {
      return propsP1;
    }
    const returnP1 = ResolveReturnType(mappedParts);
    if (returnP1) {
      return returnP1;
    }
    return 'not';
  };
  return rpp;
};

export const InternalArgsBuilt = ({
  props,
  ops,
  returns,
  scalars,
  vars,
}: {
  props: AllTypesPropsType;
  returns: ReturnTypesType;
  ops: Operations;
  scalars?: ScalarDefinition;
  vars: Array<{ name: string; graphQLType: string }>;
}) => {
  const arb = (a: ZeusArgsType, p = '', root = true): string => {
    if (typeof a === 'string') {
      if (a.startsWith(START_VAR_NAME)) {
        const [varName, graphQLType] = a.replace(START_VAR_NAME, '$').split(GRAPHQL_TYPE_SEPARATOR);
        const v = vars.find((v) => v.name === varName);
        if (!v) {
          vars.push({
            name: varName,
            graphQLType,
          });
        } else {
          if (v.graphQLType !== graphQLType) {
            throw new Error(
              `Invalid variable exists with two different GraphQL Types, "${v.graphQLType}" and ${graphQLType}`,
            );
          }
        }
        return varName;
      }
    }
    const checkType = ResolveFromPath(props, returns, ops)(p);
    if (checkType.startsWith('scalar.')) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, ...splittedScalar] = checkType.split('.');
      const scalarKey = splittedScalar.join('.');
      return (scalars?.[scalarKey]?.encode?.(a) as string) || JSON.stringify(a);
    }
    if (Array.isArray(a)) {
      return `[${a.map((arr) => arb(arr, p, false)).join(', ')}]`;
    }
    if (typeof a === 'string') {
      if (checkType === 'enum') {
        return a;
      }
      return `${JSON.stringify(a)}`;
    }
    if (typeof a === 'object') {
      if (a === null) {
        return `null`;
      }
      const returnedObjectString = Object.entries(a)
        .filter(([, v]) => typeof v !== 'undefined')
        .map(([k, v]) => `${k}: ${arb(v, [p, k].join(SEPARATOR), false)}`)
        .join(',\n');
      if (!root) {
        return `{${returnedObjectString}}`;
      }
      return returnedObjectString;
    }
    return `${a}`;
  };
  return arb;
};

export const resolverFor = <X, T extends keyof ResolverInputTypes, Z extends keyof ResolverInputTypes[T]>(
  type: T,
  field: Z,
  fn: (
    args: Required<ResolverInputTypes[T]>[Z] extends [infer Input, any] ? Input : any,
    source: any,
  ) => Z extends keyof ModelTypes[T] ? ModelTypes[T][Z] | Promise<ModelTypes[T][Z]> | X : never,
) => fn as (args?: any, source?: any) => ReturnType<typeof fn>;

export type UnwrapPromise<T> = T extends Promise<infer R> ? R : T;
export type ZeusState<T extends (...args: any[]) => Promise<any>> = NonNullable<UnwrapPromise<ReturnType<T>>>;
export type ZeusHook<
  T extends (...args: any[]) => Record<string, (...args: any[]) => Promise<any>>,
  N extends keyof ReturnType<T>,
> = ZeusState<ReturnType<T>[N]>;

export type WithTypeNameValue<T> = T & {
  __typename?: boolean;
  __directives?: string;
};
export type AliasType<T> = WithTypeNameValue<T> & {
  __alias?: Record<string, WithTypeNameValue<T>>;
};
type DeepAnify<T> = {
  [P in keyof T]?: any;
};
type IsPayLoad<T> = T extends [any, infer PayLoad] ? PayLoad : T;
export type ScalarDefinition = Record<string, ScalarResolver>;

type IsScalar<S, SCLR extends ScalarDefinition> = S extends 'scalar' & { name: infer T }
  ? T extends keyof SCLR
    ? SCLR[T]['decode'] extends (s: unknown) => unknown
      ? ReturnType<SCLR[T]['decode']>
      : unknown
    : unknown
  : S;
type IsArray<T, U, SCLR extends ScalarDefinition> = T extends Array<infer R>
  ? InputType<R, U, SCLR>[]
  : InputType<T, U, SCLR>;
type FlattenArray<T> = T extends Array<infer R> ? R : T;
type BaseZeusResolver = boolean | 1 | string | Variable<any, string>;

type IsInterfaced<SRC extends DeepAnify<DST>, DST, SCLR extends ScalarDefinition> = FlattenArray<SRC> extends
  | ZEUS_INTERFACES
  | ZEUS_UNIONS
  ? {
      [P in keyof SRC]: SRC[P] extends '__union' & infer R
        ? P extends keyof DST
          ? IsArray<R, '__typename' extends keyof DST ? DST[P] & { __typename: true } : DST[P], SCLR>
          : IsArray<R, '__typename' extends keyof DST ? { __typename: true } : Record<string, never>, SCLR>
        : never;
    }[keyof SRC] & {
      [P in keyof Omit<
        Pick<
          SRC,
          {
            [P in keyof DST]: SRC[P] extends '__union' & infer R ? never : P;
          }[keyof DST]
        >,
        '__typename'
      >]: IsPayLoad<DST[P]> extends BaseZeusResolver ? IsScalar<SRC[P], SCLR> : IsArray<SRC[P], DST[P], SCLR>;
    }
  : {
      [P in keyof Pick<SRC, keyof DST>]: IsPayLoad<DST[P]> extends BaseZeusResolver
        ? IsScalar<SRC[P], SCLR>
        : IsArray<SRC[P], DST[P], SCLR>;
    };

export type MapType<SRC, DST, SCLR extends ScalarDefinition> = SRC extends DeepAnify<DST>
  ? IsInterfaced<SRC, DST, SCLR>
  : never;
// eslint-disable-next-line @typescript-eslint/ban-types
export type InputType<SRC, DST, SCLR extends ScalarDefinition = {}> = IsPayLoad<DST> extends { __alias: infer R }
  ? {
      [P in keyof R]: MapType<SRC, R[P], SCLR>[keyof MapType<SRC, R[P], SCLR>];
    } & MapType<SRC, Omit<IsPayLoad<DST>, '__alias'>, SCLR>
  : MapType<SRC, IsPayLoad<DST>, SCLR>;
export type SubscriptionToGraphQL<Z, T, SCLR extends ScalarDefinition> = {
  ws: WebSocket;
  on: (fn: (args: InputType<T, Z, SCLR>) => void) => void;
  off: (fn: (e: { data?: InputType<T, Z, SCLR>; code?: number; reason?: string; message?: string }) => void) => void;
  error: (fn: (e: { data?: InputType<T, Z, SCLR>; errors?: string[] }) => void) => void;
  open: () => void;
};

// eslint-disable-next-line @typescript-eslint/ban-types
export type FromSelector<SELECTOR, NAME extends keyof GraphQLTypes, SCLR extends ScalarDefinition = {}> = InputType<
  GraphQLTypes[NAME],
  SELECTOR,
  SCLR
>;

export type ScalarResolver = {
  encode?: (s: unknown) => string;
  decode?: (s: unknown) => unknown;
};

export type SelectionFunction<V> = <Z extends V>(
  t: Z & {
    [P in keyof Z]: P extends keyof V ? Z[P] : never;
  },
) => Z;

type BuiltInVariableTypes = {
  ['String']: string;
  ['Int']: number;
  ['Float']: number;
  ['ID']: unknown;
  ['Boolean']: boolean;
};
type AllVariableTypes = keyof BuiltInVariableTypes | keyof ZEUS_VARIABLES;
type VariableRequired<T extends string> = `${T}!` | T | `[${T}]` | `[${T}]!` | `[${T}!]` | `[${T}!]!`;
type VR<T extends string> = VariableRequired<VariableRequired<T>>;

export type GraphQLVariableType = VR<AllVariableTypes>;

type ExtractVariableTypeString<T extends string> = T extends VR<infer R1>
  ? R1 extends VR<infer R2>
    ? R2 extends VR<infer R3>
      ? R3 extends VR<infer R4>
        ? R4 extends VR<infer R5>
          ? R5
          : R4
        : R3
      : R2
    : R1
  : T;

type DecomposeType<T, Type> = T extends `[${infer R}]`
  ? Array<DecomposeType<R, Type>> | undefined
  : T extends `${infer R}!`
  ? NonNullable<DecomposeType<R, Type>>
  : Type | undefined;

type ExtractTypeFromGraphQLType<T extends string> = T extends keyof ZEUS_VARIABLES
  ? ZEUS_VARIABLES[T]
  : T extends keyof BuiltInVariableTypes
  ? BuiltInVariableTypes[T]
  : any;

export type GetVariableType<T extends string> = DecomposeType<
  T,
  ExtractTypeFromGraphQLType<ExtractVariableTypeString<T>>
>;

type UndefinedKeys<T> = {
  [K in keyof T]-?: T[K] extends NonNullable<T[K]> ? never : K;
}[keyof T];

type WithNullableKeys<T> = Pick<T, UndefinedKeys<T>>;
type WithNonNullableKeys<T> = Omit<T, UndefinedKeys<T>>;

type OptionalKeys<T> = {
  [P in keyof T]?: T[P];
};

export type WithOptionalNullables<T> = OptionalKeys<WithNullableKeys<T>> & WithNonNullableKeys<T>;

export type Variable<T extends GraphQLVariableType, Name extends string> = {
  ' __zeus_name': Name;
  ' __zeus_type': T;
};

export type ExtractVariablesDeep<Query> = Query extends Variable<infer VType, infer VName>
  ? { [key in VName]: GetVariableType<VType> }
  : Query extends string | number | boolean | Array<string | number | boolean>
  ? // eslint-disable-next-line @typescript-eslint/ban-types
    {}
  : UnionToIntersection<{ [K in keyof Query]: WithOptionalNullables<ExtractVariablesDeep<Query[K]>> }[keyof Query]>;

export type ExtractVariables<Query> = Query extends Variable<infer VType, infer VName>
  ? { [key in VName]: GetVariableType<VType> }
  : Query extends [infer Inputs, infer Outputs]
  ? ExtractVariablesDeep<Inputs> & ExtractVariables<Outputs>
  : Query extends string | number | boolean | Array<string | number | boolean>
  ? // eslint-disable-next-line @typescript-eslint/ban-types
    {}
  : UnionToIntersection<{ [K in keyof Query]: WithOptionalNullables<ExtractVariables<Query[K]>> }[keyof Query]>;

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

export const START_VAR_NAME = `$ZEUS_VAR`;
export const GRAPHQL_TYPE_SEPARATOR = `__$GRAPHQL__`;

export const $ = <Type extends GraphQLVariableType, Name extends string>(name: Name, graphqlType: Type) => {
  return (START_VAR_NAME + name + GRAPHQL_TYPE_SEPARATOR + graphqlType) as unknown as Variable<Type, Name>;
};
type ZEUS_INTERFACES = never
export type ScalarCoders = {
}
type ZEUS_UNIONS = never

export type ValueTypes = {
    /** operations for a guest user, extend this query to perform the actions of a non-logged-in user */
["GuestQuery"]: AliasType<{
categories?: [{	pageInput: ValueTypes["PageInput"] | Variable<any, string>},ValueTypes["CategoryConnection"]],
serversByCategory?: [{	categorySlug?: string | undefined | null | Variable<any, string>,	filter: ValueTypes["ServersFilter"] | Variable<any, string>},ValueTypes["ServerConnection"]],
serverById?: [{	serverId: string | Variable<any, string>},ValueTypes["Server"]],
		__typename?: boolean | `@${string}`
}>;
	["Server"]: AliasType<{
	_id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	title?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	category?:ValueTypes["Category"],
	channels?:ValueTypes["Channel"],
	interestedUsers?:ValueTypes["InterestedUser"],
	iAmInterested?:boolean | `@${string}`,
	host?:ValueTypes["User"],
		__typename?: boolean | `@${string}`
}>;
	["Category"]: AliasType<{
	slug?:boolean | `@${string}`,
	image?:boolean | `@${string}`,
	image_thumbnail?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CategoryConnection"]: AliasType<{
	categories?:ValueTypes["Category"],
	pageInfo?:ValueTypes["PageInfo"],
		__typename?: boolean | `@${string}`
}>;
	["PageInput"]: {
	limit: number | Variable<any, string>,
	start?: number | undefined | null | Variable<any, string>
};
	["MessageSortByInput"]: {
	field?: ValueTypes["MessageSortFields"] | undefined | null | Variable<any, string>,
	direction?: ValueTypes["SortDirection"] | undefined | null | Variable<any, string>
};
	["PageInfo"]: AliasType<{
	hasNext?:boolean | `@${string}`,
	total?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ServerConnection"]: AliasType<{
	servers?:ValueTypes["Server"],
	pageInfo?:ValueTypes["PageInfo"],
		__typename?: boolean | `@${string}`
}>;
	["OrganisatorMutation"]: AliasType<{
createServer?: [{	server: ValueTypes["CreateServer"] | Variable<any, string>},boolean | `@${string}`],
serverOps?: [{	serverId: string | Variable<any, string>},ValueTypes["ServerOps"]],
		__typename?: boolean | `@${string}`
}>;
	["ServersFilter"]: {
	pageInput: ValueTypes["PageInput"] | Variable<any, string>,
	search?: string | undefined | null | Variable<any, string>
};
	["Channel"]: AliasType<{
	/** when channel is closed only organisator can post */
	open?:boolean | `@${string}`,
	tournament?:boolean | `@${string}`,
	server?:ValueTypes["Server"],
messages?: [{	page: ValueTypes["PageInput"] | Variable<any, string>,	sortBy?: ValueTypes["MessageSortByInput"] | undefined | null | Variable<any, string>},ValueTypes["MessageConnection"]],
	_id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["AttachmentUrl"]: AliasType<{
	image?:boolean | `@${string}`,
	image_thumbnail?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Message"]: AliasType<{
	text?:boolean | `@${string}`,
	attachmentsUrls?:ValueTypes["AttachmentUrl"],
replies?: [{	page: ValueTypes["PageInput"] | Variable<any, string>},ValueTypes["MessageConnection"]],
	channel?:ValueTypes["Channel"],
	user?:ValueTypes["User"],
	_id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ChannelOps"]: AliasType<{
update?: [{	channel: ValueTypes["UpdateChannelInput"] | Variable<any, string>},boolean | `@${string}`],
	delete?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ServerOps"]: AliasType<{
update?: [{	server: ValueTypes["UpdateServer"] | Variable<any, string>},boolean | `@${string}`],
	delete?:boolean | `@${string}`,
createChannel?: [{	channel: ValueTypes["CreateChannelInput"] | Variable<any, string>},boolean | `@${string}`],
channelOps?: [{	channelId: string | Variable<any, string>},ValueTypes["ChannelOps"]],
banUser?: [{	userId: string | Variable<any, string>},boolean | `@${string}`],
unbanUser?: [{	userId: string | Variable<any, string>},boolean | `@${string}`],
		__typename?: boolean | `@${string}`
}>;
	["UserChannelOps"]: AliasType<{
sendMessage?: [{	message: ValueTypes["MessageInput"] | Variable<any, string>},boolean | `@${string}`],
uploadFile?: [{	key: string | Variable<any, string>},ValueTypes["UploadResponse"]],
		__typename?: boolean | `@${string}`
}>;
	["MessageConnection"]: AliasType<{
	messages?:ValueTypes["Message"],
	pageInfo?:ValueTypes["PageInfo"],
		__typename?: boolean | `@${string}`
}>;
	["OrganisatorQuery"]: AliasType<{
myServers?: [{	filter: ValueTypes["ServersFilter"] | Variable<any, string>},ValueTypes["ServerConnection"]],
		__typename?: boolean | `@${string}`
}>;
	["InterestedUser"]: AliasType<{
	username?:boolean | `@${string}`,
	_id?:boolean | `@${string}`,
	fullName?:boolean | `@${string}`,
	avatarUrl?:boolean | `@${string}`,
	banned?:boolean | `@${string}`,
	blockedByUser?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["MessageInput"]: {
	text?: string | undefined | null | Variable<any, string>,
	attachmentsUrls?: Array<string> | undefined | null | Variable<any, string>
};
	["CreateServer"]: {
	title: string | Variable<any, string>,
	description: string | Variable<any, string>,
	category: string | Variable<any, string>
};
	["CreateChannelInput"]: {
	open?: boolean | undefined | null | Variable<any, string>,
	tournament?: boolean | undefined | null | Variable<any, string>,
	name: string | Variable<any, string>,
	description?: string | undefined | null | Variable<any, string>
};
	["UploadResponse"]: AliasType<{
	getURL?:boolean | `@${string}`,
	putURL?:boolean | `@${string}`,
	key?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["UpdateServer"]: {
	title?: string | undefined | null | Variable<any, string>,
	description?: string | undefined | null | Variable<any, string>,
	category?: string | undefined | null | Variable<any, string>
};
	["UpdateChannelInput"]: {
	open?: boolean | undefined | null | Variable<any, string>,
	tournament?: boolean | undefined | null | Variable<any, string>,
	name?: string | undefined | null | Variable<any, string>,
	description?: string | undefined | null | Variable<any, string>
};
	["SortDirection"]:SortDirection;
	["MessageSortFields"]:MessageSortFields;
	["Query"]: AliasType<{
	users?:ValueTypes["UsersQuery"],
		__typename?: boolean | `@${string}`
}>;
	["Mutation"]: AliasType<{
	users?:ValueTypes["UsersMutation"],
		__typename?: boolean | `@${string}`
}>;
	["User"]: AliasType<{
	_id?:boolean | `@${string}`,
	username?:boolean | `@${string}`,
	termsAccepted?:boolean | `@${string}`,
	privacyPolicyAccepted?:boolean | `@${string}`,
followedServers?: [{	pageInput: ValueTypes["PageInput"] | Variable<any, string>},ValueTypes["ServerConnection"]],
	isOrganisator?:boolean | `@${string}`,
	fullName?:boolean | `@${string}`,
	avatarUrl?:boolean | `@${string}`,
	blockedUsers?:boolean | `@${string}`,
	emailConfirmed?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["UsersQuery"]: AliasType<{
	user?:ValueTypes["AuthorizedUserQuery"],
	publicUsers?:ValueTypes["PublicUsersQuery"],
		__typename?: boolean | `@${string}`
}>;
	["UsersMutation"]: AliasType<{
	user?:ValueTypes["AuthorizedUserMutation"],
	publicUsers?:ValueTypes["PublicUsersMutation"],
		__typename?: boolean | `@${string}`
}>;
	["PublicUsersQuery"]: AliasType<{
	guest?:ValueTypes["GuestQuery"],
	login?:ValueTypes["LoginQuery"],
getGoogleOAuthLink?: [{	setup: ValueTypes["GetOAuthInput"] | Variable<any, string>},boolean | `@${string}`],
getMicrosoftOAuthLink?: [{	setup: ValueTypes["GetOAuthInput"] | Variable<any, string>},boolean | `@${string}`],
getGithubOAuthLink?: [{	setup: ValueTypes["GetOAuthInput"] | Variable<any, string>},boolean | `@${string}`],
getAppleOAuthLink?: [{	setup: ValueTypes["GetOAuthInput"] | Variable<any, string>},boolean | `@${string}`],
requestForForgotPassword?: [{	username: string | Variable<any, string>},boolean | `@${string}`],
		__typename?: boolean | `@${string}`
}>;
	/** operations for logged in user, extend this query to perform user actions */
["AuthorizedUserQuery"]: AliasType<{
	organisator?:ValueTypes["OrganisatorQuery"],
channelById?: [{	channelId: string | Variable<any, string>},ValueTypes["Channel"]],
	me?:ValueTypes["User"],
		__typename?: boolean | `@${string}`
}>;
	/** operations for logged in user, extend this query to perform user actions */
["AuthorizedUserMutation"]: AliasType<{
	organisator?:ValueTypes["OrganisatorMutation"],
channel?: [{	channelId: string | Variable<any, string>},ValueTypes["UserChannelOps"]],
followServer?: [{	serverId: string | Variable<any, string>,	follow?: boolean | undefined | null | Variable<any, string>},boolean | `@${string}`],
	/** when user is an organisator they automatically accept terms */
	makeMeOrganisator?:boolean | `@${string}`,
uploadFile?: [{	key: string | Variable<any, string>},ValueTypes["UploadResponse"]],
blockUser?: [{	block?: boolean | undefined | null | Variable<any, string>,	userId: string | Variable<any, string>},boolean | `@${string}`],
changePasswordWhenLogged?: [{	changePasswordData: ValueTypes["ChangePasswordWhenLoggedInput"] | Variable<any, string>},ValueTypes["ChangePasswordWhenLoggedResponse"]],
editUser?: [{	updatedUser: ValueTypes["UpdateUserInput"] | Variable<any, string>},ValueTypes["EditUserResponse"]],
integrateSocialAccount?: [{	userData: ValueTypes["SimpleUserInput"] | Variable<any, string>},ValueTypes["IntegrateSocialAccountResponse"]],
		__typename?: boolean | `@${string}`
}>;
	["GetOAuthInput"]: {
	scopes?: Array<string> | undefined | null | Variable<any, string>,
	state?: string | undefined | null | Variable<any, string>,
	redirectUri?: string | undefined | null | Variable<any, string>
};
	["PublicUsersMutation"]: AliasType<{
register?: [{	user: ValueTypes["RegisterInput"] | Variable<any, string>},ValueTypes["RegisterResponse"]],
verifyEmail?: [{	verifyData: ValueTypes["VerifyEmailInput"] | Variable<any, string>},ValueTypes["VerifyEmailResponse"]],
changePasswordWithToken?: [{	token: ValueTypes["ChangePasswordWithTokenInput"] | Variable<any, string>},ValueTypes["ChangePasswordWithTokenResponse"]],
generateOAuthToken?: [{	tokenData: ValueTypes["GenerateOAuthTokenInput"] | Variable<any, string>},ValueTypes["GenerateOAuthTokenResponse"]],
		__typename?: boolean | `@${string}`
}>;
	["EditUserError"]:EditUserError;
	["EditUserResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["VerifyEmailError"]:VerifyEmailError;
	["VerifyEmailResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ChangePasswordWhenLoggedError"]:ChangePasswordWhenLoggedError;
	["ChangePasswordWhenLoggedResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ChangePasswordWithTokenError"]:ChangePasswordWithTokenError;
	["ChangePasswordWithTokenResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["SquashAccountsError"]:SquashAccountsError;
	["IntegrateSocialAccountError"]:IntegrateSocialAccountError;
	["IntegrateSocialAccountResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["GenerateOAuthTokenError"]:GenerateOAuthTokenError;
	["GenerateOAuthTokenResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["UpdateUserInput"]: {
	username?: string | undefined | null | Variable<any, string>,
	fullName?: string | undefined | null | Variable<any, string>,
	avatarUrl?: string | undefined | null | Variable<any, string>
};
	["GenerateOAuthTokenInput"]: {
	social: ValueTypes["SocialKind"] | Variable<any, string>,
	code: string | Variable<any, string>
};
	["SimpleUserInput"]: {
	username: string | Variable<any, string>,
	password: string | Variable<any, string>
};
	["LoginInput"]: {
	username: string | Variable<any, string>,
	password: string | Variable<any, string>
};
	["VerifyEmailInput"]: {
	token: string | Variable<any, string>
};
	["ChangePasswordWithTokenInput"]: {
	username: string | Variable<any, string>,
	forgotToken: string | Variable<any, string>,
	newPassword: string | Variable<any, string>
};
	["ChangePasswordWhenLoggedInput"]: {
	oldPassword: string | Variable<any, string>,
	newPassword: string | Variable<any, string>
};
	["RegisterInput"]: {
	username: string | Variable<any, string>,
	password: string | Variable<any, string>,
	fullName?: string | undefined | null | Variable<any, string>,
	invitationToken?: string | undefined | null | Variable<any, string>
};
	["SocialKind"]:SocialKind;
	["LoginQuery"]: AliasType<{
password?: [{	user: ValueTypes["LoginInput"] | Variable<any, string>},ValueTypes["LoginResponse"]],
provider?: [{	params: ValueTypes["ProviderLoginInput"] | Variable<any, string>},ValueTypes["ProviderLoginQuery"]],
refreshToken?: [{	refreshToken: string | Variable<any, string>},boolean | `@${string}`],
		__typename?: boolean | `@${string}`
}>;
	["ProviderLoginInput"]: {
	code: string | Variable<any, string>,
	redirectUri: string | Variable<any, string>
};
	["ProviderLoginQuery"]: AliasType<{
	apple?:ValueTypes["ProviderResponse"],
	google?:ValueTypes["ProviderResponse"],
	github?:ValueTypes["ProviderResponse"],
	microsoft?:ValueTypes["ProviderResponse"],
		__typename?: boolean | `@${string}`
}>;
	["RegisterErrors"]:RegisterErrors;
	["LoginErrors"]:LoginErrors;
	["ProviderErrors"]:ProviderErrors;
	["RegisterResponse"]: AliasType<{
	registered?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["LoginResponse"]: AliasType<{
	/** same value as accessToken, for delete in future, 
improvise, adapt, overcome, frontend! */
	login?:boolean | `@${string}`,
	accessToken?:boolean | `@${string}`,
	refreshToken?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ProviderResponse"]: AliasType<{
	/** same value as accessToken, for delete in future, 
improvise, adapt, overcome, frontend! */
	jwt?:boolean | `@${string}`,
	accessToken?:boolean | `@${string}`,
	refreshToken?:boolean | `@${string}`,
	providerAccessToken?:boolean | `@${string}`,
	/** field describes whether this is first login attempt for this username */
	register?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>
  }

export type ResolverInputTypes = {
    /** operations for a guest user, extend this query to perform the actions of a non-logged-in user */
["GuestQuery"]: AliasType<{
categories?: [{	pageInput: ResolverInputTypes["PageInput"]},ResolverInputTypes["CategoryConnection"]],
serversByCategory?: [{	categorySlug?: string | undefined | null,	filter: ResolverInputTypes["ServersFilter"]},ResolverInputTypes["ServerConnection"]],
serverById?: [{	serverId: string},ResolverInputTypes["Server"]],
		__typename?: boolean | `@${string}`
}>;
	["Server"]: AliasType<{
	_id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	title?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
	category?:ResolverInputTypes["Category"],
	channels?:ResolverInputTypes["Channel"],
	interestedUsers?:ResolverInputTypes["InterestedUser"],
	iAmInterested?:boolean | `@${string}`,
	host?:ResolverInputTypes["User"],
		__typename?: boolean | `@${string}`
}>;
	["Category"]: AliasType<{
	slug?:boolean | `@${string}`,
	image?:boolean | `@${string}`,
	image_thumbnail?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CategoryConnection"]: AliasType<{
	categories?:ResolverInputTypes["Category"],
	pageInfo?:ResolverInputTypes["PageInfo"],
		__typename?: boolean | `@${string}`
}>;
	["PageInput"]: {
	limit: number,
	start?: number | undefined | null
};
	["MessageSortByInput"]: {
	field?: ResolverInputTypes["MessageSortFields"] | undefined | null,
	direction?: ResolverInputTypes["SortDirection"] | undefined | null
};
	["PageInfo"]: AliasType<{
	hasNext?:boolean | `@${string}`,
	total?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ServerConnection"]: AliasType<{
	servers?:ResolverInputTypes["Server"],
	pageInfo?:ResolverInputTypes["PageInfo"],
		__typename?: boolean | `@${string}`
}>;
	["OrganisatorMutation"]: AliasType<{
createServer?: [{	server: ResolverInputTypes["CreateServer"]},boolean | `@${string}`],
serverOps?: [{	serverId: string},ResolverInputTypes["ServerOps"]],
		__typename?: boolean | `@${string}`
}>;
	["ServersFilter"]: {
	pageInput: ResolverInputTypes["PageInput"],
	search?: string | undefined | null
};
	["Channel"]: AliasType<{
	/** when channel is closed only organisator can post */
	open?:boolean | `@${string}`,
	tournament?:boolean | `@${string}`,
	server?:ResolverInputTypes["Server"],
messages?: [{	page: ResolverInputTypes["PageInput"],	sortBy?: ResolverInputTypes["MessageSortByInput"] | undefined | null},ResolverInputTypes["MessageConnection"]],
	_id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	description?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["AttachmentUrl"]: AliasType<{
	image?:boolean | `@${string}`,
	image_thumbnail?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Message"]: AliasType<{
	text?:boolean | `@${string}`,
	attachmentsUrls?:ResolverInputTypes["AttachmentUrl"],
replies?: [{	page: ResolverInputTypes["PageInput"]},ResolverInputTypes["MessageConnection"]],
	channel?:ResolverInputTypes["Channel"],
	user?:ResolverInputTypes["User"],
	_id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ChannelOps"]: AliasType<{
update?: [{	channel: ResolverInputTypes["UpdateChannelInput"]},boolean | `@${string}`],
	delete?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ServerOps"]: AliasType<{
update?: [{	server: ResolverInputTypes["UpdateServer"]},boolean | `@${string}`],
	delete?:boolean | `@${string}`,
createChannel?: [{	channel: ResolverInputTypes["CreateChannelInput"]},boolean | `@${string}`],
channelOps?: [{	channelId: string},ResolverInputTypes["ChannelOps"]],
banUser?: [{	userId: string},boolean | `@${string}`],
unbanUser?: [{	userId: string},boolean | `@${string}`],
		__typename?: boolean | `@${string}`
}>;
	["UserChannelOps"]: AliasType<{
sendMessage?: [{	message: ResolverInputTypes["MessageInput"]},boolean | `@${string}`],
uploadFile?: [{	key: string},ResolverInputTypes["UploadResponse"]],
		__typename?: boolean | `@${string}`
}>;
	["MessageConnection"]: AliasType<{
	messages?:ResolverInputTypes["Message"],
	pageInfo?:ResolverInputTypes["PageInfo"],
		__typename?: boolean | `@${string}`
}>;
	["OrganisatorQuery"]: AliasType<{
myServers?: [{	filter: ResolverInputTypes["ServersFilter"]},ResolverInputTypes["ServerConnection"]],
		__typename?: boolean | `@${string}`
}>;
	["InterestedUser"]: AliasType<{
	username?:boolean | `@${string}`,
	_id?:boolean | `@${string}`,
	fullName?:boolean | `@${string}`,
	avatarUrl?:boolean | `@${string}`,
	banned?:boolean | `@${string}`,
	blockedByUser?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["MessageInput"]: {
	text?: string | undefined | null,
	attachmentsUrls?: Array<string> | undefined | null
};
	["CreateServer"]: {
	title: string,
	description: string,
	category: string
};
	["CreateChannelInput"]: {
	open?: boolean | undefined | null,
	tournament?: boolean | undefined | null,
	name: string,
	description?: string | undefined | null
};
	["UploadResponse"]: AliasType<{
	getURL?:boolean | `@${string}`,
	putURL?:boolean | `@${string}`,
	key?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["UpdateServer"]: {
	title?: string | undefined | null,
	description?: string | undefined | null,
	category?: string | undefined | null
};
	["UpdateChannelInput"]: {
	open?: boolean | undefined | null,
	tournament?: boolean | undefined | null,
	name?: string | undefined | null,
	description?: string | undefined | null
};
	["SortDirection"]:SortDirection;
	["MessageSortFields"]:MessageSortFields;
	["Query"]: AliasType<{
	users?:ResolverInputTypes["UsersQuery"],
		__typename?: boolean | `@${string}`
}>;
	["Mutation"]: AliasType<{
	users?:ResolverInputTypes["UsersMutation"],
		__typename?: boolean | `@${string}`
}>;
	["User"]: AliasType<{
	_id?:boolean | `@${string}`,
	username?:boolean | `@${string}`,
	termsAccepted?:boolean | `@${string}`,
	privacyPolicyAccepted?:boolean | `@${string}`,
followedServers?: [{	pageInput: ResolverInputTypes["PageInput"]},ResolverInputTypes["ServerConnection"]],
	isOrganisator?:boolean | `@${string}`,
	fullName?:boolean | `@${string}`,
	avatarUrl?:boolean | `@${string}`,
	blockedUsers?:boolean | `@${string}`,
	emailConfirmed?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["UsersQuery"]: AliasType<{
	user?:ResolverInputTypes["AuthorizedUserQuery"],
	publicUsers?:ResolverInputTypes["PublicUsersQuery"],
		__typename?: boolean | `@${string}`
}>;
	["UsersMutation"]: AliasType<{
	user?:ResolverInputTypes["AuthorizedUserMutation"],
	publicUsers?:ResolverInputTypes["PublicUsersMutation"],
		__typename?: boolean | `@${string}`
}>;
	["PublicUsersQuery"]: AliasType<{
	guest?:ResolverInputTypes["GuestQuery"],
	login?:ResolverInputTypes["LoginQuery"],
getGoogleOAuthLink?: [{	setup: ResolverInputTypes["GetOAuthInput"]},boolean | `@${string}`],
getMicrosoftOAuthLink?: [{	setup: ResolverInputTypes["GetOAuthInput"]},boolean | `@${string}`],
getGithubOAuthLink?: [{	setup: ResolverInputTypes["GetOAuthInput"]},boolean | `@${string}`],
getAppleOAuthLink?: [{	setup: ResolverInputTypes["GetOAuthInput"]},boolean | `@${string}`],
requestForForgotPassword?: [{	username: string},boolean | `@${string}`],
		__typename?: boolean | `@${string}`
}>;
	/** operations for logged in user, extend this query to perform user actions */
["AuthorizedUserQuery"]: AliasType<{
	organisator?:ResolverInputTypes["OrganisatorQuery"],
channelById?: [{	channelId: string},ResolverInputTypes["Channel"]],
	me?:ResolverInputTypes["User"],
		__typename?: boolean | `@${string}`
}>;
	/** operations for logged in user, extend this query to perform user actions */
["AuthorizedUserMutation"]: AliasType<{
	organisator?:ResolverInputTypes["OrganisatorMutation"],
channel?: [{	channelId: string},ResolverInputTypes["UserChannelOps"]],
followServer?: [{	serverId: string,	follow?: boolean | undefined | null},boolean | `@${string}`],
	/** when user is an organisator they automatically accept terms */
	makeMeOrganisator?:boolean | `@${string}`,
uploadFile?: [{	key: string},ResolverInputTypes["UploadResponse"]],
blockUser?: [{	block?: boolean | undefined | null,	userId: string},boolean | `@${string}`],
changePasswordWhenLogged?: [{	changePasswordData: ResolverInputTypes["ChangePasswordWhenLoggedInput"]},ResolverInputTypes["ChangePasswordWhenLoggedResponse"]],
editUser?: [{	updatedUser: ResolverInputTypes["UpdateUserInput"]},ResolverInputTypes["EditUserResponse"]],
integrateSocialAccount?: [{	userData: ResolverInputTypes["SimpleUserInput"]},ResolverInputTypes["IntegrateSocialAccountResponse"]],
		__typename?: boolean | `@${string}`
}>;
	["GetOAuthInput"]: {
	scopes?: Array<string> | undefined | null,
	state?: string | undefined | null,
	redirectUri?: string | undefined | null
};
	["PublicUsersMutation"]: AliasType<{
register?: [{	user: ResolverInputTypes["RegisterInput"]},ResolverInputTypes["RegisterResponse"]],
verifyEmail?: [{	verifyData: ResolverInputTypes["VerifyEmailInput"]},ResolverInputTypes["VerifyEmailResponse"]],
changePasswordWithToken?: [{	token: ResolverInputTypes["ChangePasswordWithTokenInput"]},ResolverInputTypes["ChangePasswordWithTokenResponse"]],
generateOAuthToken?: [{	tokenData: ResolverInputTypes["GenerateOAuthTokenInput"]},ResolverInputTypes["GenerateOAuthTokenResponse"]],
		__typename?: boolean | `@${string}`
}>;
	["EditUserError"]:EditUserError;
	["EditUserResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["VerifyEmailError"]:VerifyEmailError;
	["VerifyEmailResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ChangePasswordWhenLoggedError"]:ChangePasswordWhenLoggedError;
	["ChangePasswordWhenLoggedResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ChangePasswordWithTokenError"]:ChangePasswordWithTokenError;
	["ChangePasswordWithTokenResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["SquashAccountsError"]:SquashAccountsError;
	["IntegrateSocialAccountError"]:IntegrateSocialAccountError;
	["IntegrateSocialAccountResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["GenerateOAuthTokenError"]:GenerateOAuthTokenError;
	["GenerateOAuthTokenResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["UpdateUserInput"]: {
	username?: string | undefined | null,
	fullName?: string | undefined | null,
	avatarUrl?: string | undefined | null
};
	["GenerateOAuthTokenInput"]: {
	social: ResolverInputTypes["SocialKind"],
	code: string
};
	["SimpleUserInput"]: {
	username: string,
	password: string
};
	["LoginInput"]: {
	username: string,
	password: string
};
	["VerifyEmailInput"]: {
	token: string
};
	["ChangePasswordWithTokenInput"]: {
	username: string,
	forgotToken: string,
	newPassword: string
};
	["ChangePasswordWhenLoggedInput"]: {
	oldPassword: string,
	newPassword: string
};
	["RegisterInput"]: {
	username: string,
	password: string,
	fullName?: string | undefined | null,
	invitationToken?: string | undefined | null
};
	["SocialKind"]:SocialKind;
	["LoginQuery"]: AliasType<{
password?: [{	user: ResolverInputTypes["LoginInput"]},ResolverInputTypes["LoginResponse"]],
provider?: [{	params: ResolverInputTypes["ProviderLoginInput"]},ResolverInputTypes["ProviderLoginQuery"]],
refreshToken?: [{	refreshToken: string},boolean | `@${string}`],
		__typename?: boolean | `@${string}`
}>;
	["ProviderLoginInput"]: {
	code: string,
	redirectUri: string
};
	["ProviderLoginQuery"]: AliasType<{
	apple?:ResolverInputTypes["ProviderResponse"],
	google?:ResolverInputTypes["ProviderResponse"],
	github?:ResolverInputTypes["ProviderResponse"],
	microsoft?:ResolverInputTypes["ProviderResponse"],
		__typename?: boolean | `@${string}`
}>;
	["RegisterErrors"]:RegisterErrors;
	["LoginErrors"]:LoginErrors;
	["ProviderErrors"]:ProviderErrors;
	["RegisterResponse"]: AliasType<{
	registered?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["LoginResponse"]: AliasType<{
	/** same value as accessToken, for delete in future, 
improvise, adapt, overcome, frontend! */
	login?:boolean | `@${string}`,
	accessToken?:boolean | `@${string}`,
	refreshToken?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ProviderResponse"]: AliasType<{
	/** same value as accessToken, for delete in future, 
improvise, adapt, overcome, frontend! */
	jwt?:boolean | `@${string}`,
	accessToken?:boolean | `@${string}`,
	refreshToken?:boolean | `@${string}`,
	providerAccessToken?:boolean | `@${string}`,
	/** field describes whether this is first login attempt for this username */
	register?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["schema"]: AliasType<{
	query?:ResolverInputTypes["Query"],
	mutation?:ResolverInputTypes["Mutation"],
		__typename?: boolean | `@${string}`
}>
  }

export type ModelTypes = {
    /** operations for a guest user, extend this query to perform the actions of a non-logged-in user */
["GuestQuery"]: {
		categories: ModelTypes["CategoryConnection"],
	serversByCategory: ModelTypes["ServerConnection"],
	serverById?: ModelTypes["Server"] | undefined
};
	["Server"]: {
		_id: string,
	createdAt: string,
	title: string,
	description: string,
	category?: ModelTypes["Category"] | undefined,
	channels?: Array<ModelTypes["Channel"]> | undefined,
	interestedUsers: Array<ModelTypes["InterestedUser"]>,
	iAmInterested?: boolean | undefined,
	host: ModelTypes["User"]
};
	["Category"]: {
		slug: string,
	image?: string | undefined,
	image_thumbnail?: string | undefined,
	name?: string | undefined
};
	["CategoryConnection"]: {
		categories: Array<ModelTypes["Category"] | undefined>,
	pageInfo?: ModelTypes["PageInfo"] | undefined
};
	["PageInput"]: {
	limit: number,
	start?: number | undefined
};
	["MessageSortByInput"]: {
	field?: ModelTypes["MessageSortFields"] | undefined,
	direction?: ModelTypes["SortDirection"] | undefined
};
	["PageInfo"]: {
		hasNext?: boolean | undefined,
	total: number
};
	["ServerConnection"]: {
		servers: Array<ModelTypes["Server"] | undefined>,
	pageInfo?: ModelTypes["PageInfo"] | undefined
};
	["OrganisatorMutation"]: {
		createServer?: string | undefined,
	serverOps?: ModelTypes["ServerOps"] | undefined
};
	["ServersFilter"]: {
	pageInput: ModelTypes["PageInput"],
	search?: string | undefined
};
	["Channel"]: {
		/** when channel is closed only organisator can post */
	open?: boolean | undefined,
	tournament?: boolean | undefined,
	server: ModelTypes["Server"],
	messages?: ModelTypes["MessageConnection"] | undefined,
	_id: string,
	createdAt: string,
	name: string,
	description?: string | undefined
};
	["AttachmentUrl"]: {
		image?: string | undefined,
	image_thumbnail?: string | undefined
};
	["Message"]: {
		text?: string | undefined,
	attachmentsUrls?: Array<ModelTypes["AttachmentUrl"]> | undefined,
	replies: ModelTypes["MessageConnection"],
	channel: ModelTypes["Channel"],
	user: ModelTypes["User"],
	_id: string,
	createdAt: string
};
	["ChannelOps"]: {
		update?: boolean | undefined,
	delete?: boolean | undefined
};
	["ServerOps"]: {
		update?: boolean | undefined,
	delete?: boolean | undefined,
	createChannel?: string | undefined,
	channelOps?: ModelTypes["ChannelOps"] | undefined,
	banUser?: boolean | undefined,
	unbanUser?: string | undefined
};
	["UserChannelOps"]: {
		sendMessage?: boolean | undefined,
	uploadFile?: ModelTypes["UploadResponse"] | undefined
};
	["MessageConnection"]: {
		messages: Array<ModelTypes["Message"]>,
	pageInfo?: ModelTypes["PageInfo"] | undefined
};
	["OrganisatorQuery"]: {
		myServers: ModelTypes["ServerConnection"]
};
	["InterestedUser"]: {
		username: string,
	_id: string,
	fullName?: string | undefined,
	avatarUrl?: string | undefined,
	banned?: boolean | undefined,
	blockedByUser?: boolean | undefined
};
	["MessageInput"]: {
	text?: string | undefined,
	attachmentsUrls?: Array<string> | undefined
};
	["CreateServer"]: {
	title: string,
	description: string,
	category: string
};
	["CreateChannelInput"]: {
	open?: boolean | undefined,
	tournament?: boolean | undefined,
	name: string,
	description?: string | undefined
};
	["UploadResponse"]: {
		getURL: string,
	putURL: string,
	key: string
};
	["UpdateServer"]: {
	title?: string | undefined,
	description?: string | undefined,
	category?: string | undefined
};
	["UpdateChannelInput"]: {
	open?: boolean | undefined,
	tournament?: boolean | undefined,
	name?: string | undefined,
	description?: string | undefined
};
	["SortDirection"]:SortDirection;
	["MessageSortFields"]:MessageSortFields;
	["Query"]: {
		users?: ModelTypes["UsersQuery"] | undefined
};
	["Mutation"]: {
		users?: ModelTypes["UsersMutation"] | undefined
};
	["User"]: {
		_id: string,
	username: string,
	termsAccepted?: string | undefined,
	privacyPolicyAccepted?: string | undefined,
	followedServers: ModelTypes["ServerConnection"],
	isOrganisator?: boolean | undefined,
	fullName?: string | undefined,
	avatarUrl?: string | undefined,
	blockedUsers?: Array<string | undefined> | undefined,
	emailConfirmed: boolean,
	createdAt?: string | undefined
};
	["UsersQuery"]: {
		user?: ModelTypes["AuthorizedUserQuery"] | undefined,
	publicUsers?: ModelTypes["PublicUsersQuery"] | undefined
};
	["UsersMutation"]: {
		user?: ModelTypes["AuthorizedUserMutation"] | undefined,
	publicUsers?: ModelTypes["PublicUsersMutation"] | undefined
};
	["PublicUsersQuery"]: {
		guest?: ModelTypes["GuestQuery"] | undefined,
	login: ModelTypes["LoginQuery"],
	getGoogleOAuthLink: string,
	getMicrosoftOAuthLink: string,
	getGithubOAuthLink: string,
	getAppleOAuthLink: string,
	requestForForgotPassword: boolean
};
	/** operations for logged in user, extend this query to perform user actions */
["AuthorizedUserQuery"]: {
		organisator?: ModelTypes["OrganisatorQuery"] | undefined,
	channelById?: ModelTypes["Channel"] | undefined,
	me?: ModelTypes["User"] | undefined
};
	/** operations for logged in user, extend this query to perform user actions */
["AuthorizedUserMutation"]: {
		organisator?: ModelTypes["OrganisatorMutation"] | undefined,
	channel?: ModelTypes["UserChannelOps"] | undefined,
	followServer?: boolean | undefined,
	/** when user is an organisator they automatically accept terms */
	makeMeOrganisator?: boolean | undefined,
	uploadFile?: ModelTypes["UploadResponse"] | undefined,
	blockUser?: boolean | undefined,
	changePasswordWhenLogged: ModelTypes["ChangePasswordWhenLoggedResponse"],
	editUser: ModelTypes["EditUserResponse"],
	integrateSocialAccount: ModelTypes["IntegrateSocialAccountResponse"]
};
	["GetOAuthInput"]: {
	scopes?: Array<string> | undefined,
	state?: string | undefined,
	redirectUri?: string | undefined
};
	["PublicUsersMutation"]: {
		register: ModelTypes["RegisterResponse"],
	verifyEmail: ModelTypes["VerifyEmailResponse"],
	changePasswordWithToken: ModelTypes["ChangePasswordWithTokenResponse"],
	generateOAuthToken: ModelTypes["GenerateOAuthTokenResponse"]
};
	["EditUserError"]:EditUserError;
	["EditUserResponse"]: {
		result?: boolean | undefined,
	hasError?: ModelTypes["EditUserError"] | undefined
};
	["VerifyEmailError"]:VerifyEmailError;
	["VerifyEmailResponse"]: {
		result?: boolean | undefined,
	hasError?: ModelTypes["VerifyEmailError"] | undefined
};
	["ChangePasswordWhenLoggedError"]:ChangePasswordWhenLoggedError;
	["ChangePasswordWhenLoggedResponse"]: {
		result?: boolean | undefined,
	hasError?: ModelTypes["ChangePasswordWhenLoggedError"] | undefined
};
	["ChangePasswordWithTokenError"]:ChangePasswordWithTokenError;
	["ChangePasswordWithTokenResponse"]: {
		result?: boolean | undefined,
	hasError?: ModelTypes["ChangePasswordWithTokenError"] | undefined
};
	["SquashAccountsError"]:SquashAccountsError;
	["IntegrateSocialAccountError"]:IntegrateSocialAccountError;
	["IntegrateSocialAccountResponse"]: {
		result?: boolean | undefined,
	hasError?: ModelTypes["IntegrateSocialAccountError"] | undefined
};
	["GenerateOAuthTokenError"]:GenerateOAuthTokenError;
	["GenerateOAuthTokenResponse"]: {
		result?: string | undefined,
	hasError?: ModelTypes["GenerateOAuthTokenError"] | undefined
};
	["UpdateUserInput"]: {
	username?: string | undefined,
	fullName?: string | undefined,
	avatarUrl?: string | undefined
};
	["GenerateOAuthTokenInput"]: {
	social: ModelTypes["SocialKind"],
	code: string
};
	["SimpleUserInput"]: {
	username: string,
	password: string
};
	["LoginInput"]: {
	username: string,
	password: string
};
	["VerifyEmailInput"]: {
	token: string
};
	["ChangePasswordWithTokenInput"]: {
	username: string,
	forgotToken: string,
	newPassword: string
};
	["ChangePasswordWhenLoggedInput"]: {
	oldPassword: string,
	newPassword: string
};
	["RegisterInput"]: {
	username: string,
	password: string,
	fullName?: string | undefined,
	invitationToken?: string | undefined
};
	["SocialKind"]:SocialKind;
	["LoginQuery"]: {
		password: ModelTypes["LoginResponse"],
	provider: ModelTypes["ProviderLoginQuery"],
	/** endpoint for refreshing accessToken based on refreshToken */
	refreshToken: string
};
	["ProviderLoginInput"]: {
	code: string,
	redirectUri: string
};
	["ProviderLoginQuery"]: {
		apple?: ModelTypes["ProviderResponse"] | undefined,
	google?: ModelTypes["ProviderResponse"] | undefined,
	github?: ModelTypes["ProviderResponse"] | undefined,
	microsoft?: ModelTypes["ProviderResponse"] | undefined
};
	["RegisterErrors"]:RegisterErrors;
	["LoginErrors"]:LoginErrors;
	["ProviderErrors"]:ProviderErrors;
	["RegisterResponse"]: {
		registered?: boolean | undefined,
	hasError?: ModelTypes["RegisterErrors"] | undefined
};
	["LoginResponse"]: {
		/** same value as accessToken, for delete in future, 
improvise, adapt, overcome, frontend! */
	login?: string | undefined,
	accessToken?: string | undefined,
	refreshToken?: string | undefined,
	hasError?: ModelTypes["LoginErrors"] | undefined
};
	["ProviderResponse"]: {
		/** same value as accessToken, for delete in future, 
improvise, adapt, overcome, frontend! */
	jwt?: string | undefined,
	accessToken?: string | undefined,
	refreshToken?: string | undefined,
	providerAccessToken?: string | undefined,
	/** field describes whether this is first login attempt for this username */
	register?: boolean | undefined,
	hasError?: ModelTypes["ProviderErrors"] | undefined
};
	["schema"]: {
	query?: ModelTypes["Query"] | undefined,
	mutation?: ModelTypes["Mutation"] | undefined
}
    }

export type GraphQLTypes = {
    /** operations for a guest user, extend this query to perform the actions of a non-logged-in user */
["GuestQuery"]: {
	__typename: "GuestQuery",
	categories: GraphQLTypes["CategoryConnection"],
	serversByCategory: GraphQLTypes["ServerConnection"],
	serverById?: GraphQLTypes["Server"] | undefined
};
	["Server"]: {
	__typename: "Server",
	_id: string,
	createdAt: string,
	title: string,
	description: string,
	category?: GraphQLTypes["Category"] | undefined,
	channels?: Array<GraphQLTypes["Channel"]> | undefined,
	interestedUsers: Array<GraphQLTypes["InterestedUser"]>,
	iAmInterested?: boolean | undefined,
	host: GraphQLTypes["User"]
};
	["Category"]: {
	__typename: "Category",
	slug: string,
	image?: string | undefined,
	image_thumbnail?: string | undefined,
	name?: string | undefined
};
	["CategoryConnection"]: {
	__typename: "CategoryConnection",
	categories: Array<GraphQLTypes["Category"] | undefined>,
	pageInfo?: GraphQLTypes["PageInfo"] | undefined
};
	["PageInput"]: {
		limit: number,
	start?: number | undefined
};
	["MessageSortByInput"]: {
		field?: GraphQLTypes["MessageSortFields"] | undefined,
	direction?: GraphQLTypes["SortDirection"] | undefined
};
	["PageInfo"]: {
	__typename: "PageInfo",
	hasNext?: boolean | undefined,
	total: number
};
	["ServerConnection"]: {
	__typename: "ServerConnection",
	servers: Array<GraphQLTypes["Server"] | undefined>,
	pageInfo?: GraphQLTypes["PageInfo"] | undefined
};
	["OrganisatorMutation"]: {
	__typename: "OrganisatorMutation",
	createServer?: string | undefined,
	serverOps?: GraphQLTypes["ServerOps"] | undefined
};
	["ServersFilter"]: {
		pageInput: GraphQLTypes["PageInput"],
	search?: string | undefined
};
	["Channel"]: {
	__typename: "Channel",
	/** when channel is closed only organisator can post */
	open?: boolean | undefined,
	tournament?: boolean | undefined,
	server: GraphQLTypes["Server"],
	messages?: GraphQLTypes["MessageConnection"] | undefined,
	_id: string,
	createdAt: string,
	name: string,
	description?: string | undefined
};
	["AttachmentUrl"]: {
	__typename: "AttachmentUrl",
	image?: string | undefined,
	image_thumbnail?: string | undefined
};
	["Message"]: {
	__typename: "Message",
	text?: string | undefined,
	attachmentsUrls?: Array<GraphQLTypes["AttachmentUrl"]> | undefined,
	replies: GraphQLTypes["MessageConnection"],
	channel: GraphQLTypes["Channel"],
	user: GraphQLTypes["User"],
	_id: string,
	createdAt: string
};
	["ChannelOps"]: {
	__typename: "ChannelOps",
	update?: boolean | undefined,
	delete?: boolean | undefined
};
	["ServerOps"]: {
	__typename: "ServerOps",
	update?: boolean | undefined,
	delete?: boolean | undefined,
	createChannel?: string | undefined,
	channelOps?: GraphQLTypes["ChannelOps"] | undefined,
	banUser?: boolean | undefined,
	unbanUser?: string | undefined
};
	["UserChannelOps"]: {
	__typename: "UserChannelOps",
	sendMessage?: boolean | undefined,
	uploadFile?: GraphQLTypes["UploadResponse"] | undefined
};
	["MessageConnection"]: {
	__typename: "MessageConnection",
	messages: Array<GraphQLTypes["Message"]>,
	pageInfo?: GraphQLTypes["PageInfo"] | undefined
};
	["OrganisatorQuery"]: {
	__typename: "OrganisatorQuery",
	myServers: GraphQLTypes["ServerConnection"]
};
	["InterestedUser"]: {
	__typename: "InterestedUser",
	username: string,
	_id: string,
	fullName?: string | undefined,
	avatarUrl?: string | undefined,
	banned?: boolean | undefined,
	blockedByUser?: boolean | undefined
};
	["MessageInput"]: {
		text?: string | undefined,
	attachmentsUrls?: Array<string> | undefined
};
	["CreateServer"]: {
		title: string,
	description: string,
	category: string
};
	["CreateChannelInput"]: {
		open?: boolean | undefined,
	tournament?: boolean | undefined,
	name: string,
	description?: string | undefined
};
	["UploadResponse"]: {
	__typename: "UploadResponse",
	getURL: string,
	putURL: string,
	key: string
};
	["UpdateServer"]: {
		title?: string | undefined,
	description?: string | undefined,
	category?: string | undefined
};
	["UpdateChannelInput"]: {
		open?: boolean | undefined,
	tournament?: boolean | undefined,
	name?: string | undefined,
	description?: string | undefined
};
	["SortDirection"]: SortDirection;
	["MessageSortFields"]: MessageSortFields;
	["Query"]: {
	__typename: "Query",
	users?: GraphQLTypes["UsersQuery"] | undefined
};
	["Mutation"]: {
	__typename: "Mutation",
	users?: GraphQLTypes["UsersMutation"] | undefined
};
	["User"]: {
	__typename: "User",
	_id: string,
	username: string,
	termsAccepted?: string | undefined,
	privacyPolicyAccepted?: string | undefined,
	followedServers: GraphQLTypes["ServerConnection"],
	isOrganisator?: boolean | undefined,
	fullName?: string | undefined,
	avatarUrl?: string | undefined,
	blockedUsers?: Array<string | undefined> | undefined,
	emailConfirmed: boolean,
	createdAt?: string | undefined
};
	["UsersQuery"]: {
	__typename: "UsersQuery",
	user?: GraphQLTypes["AuthorizedUserQuery"] | undefined,
	publicUsers?: GraphQLTypes["PublicUsersQuery"] | undefined
};
	["UsersMutation"]: {
	__typename: "UsersMutation",
	user?: GraphQLTypes["AuthorizedUserMutation"] | undefined,
	publicUsers?: GraphQLTypes["PublicUsersMutation"] | undefined
};
	["PublicUsersQuery"]: {
	__typename: "PublicUsersQuery",
	guest?: GraphQLTypes["GuestQuery"] | undefined,
	login: GraphQLTypes["LoginQuery"],
	getGoogleOAuthLink: string,
	getMicrosoftOAuthLink: string,
	getGithubOAuthLink: string,
	getAppleOAuthLink: string,
	requestForForgotPassword: boolean
};
	/** operations for logged in user, extend this query to perform user actions */
["AuthorizedUserQuery"]: {
	__typename: "AuthorizedUserQuery",
	organisator?: GraphQLTypes["OrganisatorQuery"] | undefined,
	channelById?: GraphQLTypes["Channel"] | undefined,
	me?: GraphQLTypes["User"] | undefined
};
	/** operations for logged in user, extend this query to perform user actions */
["AuthorizedUserMutation"]: {
	__typename: "AuthorizedUserMutation",
	organisator?: GraphQLTypes["OrganisatorMutation"] | undefined,
	channel?: GraphQLTypes["UserChannelOps"] | undefined,
	followServer?: boolean | undefined,
	/** when user is an organisator they automatically accept terms */
	makeMeOrganisator?: boolean | undefined,
	uploadFile?: GraphQLTypes["UploadResponse"] | undefined,
	blockUser?: boolean | undefined,
	changePasswordWhenLogged: GraphQLTypes["ChangePasswordWhenLoggedResponse"],
	editUser: GraphQLTypes["EditUserResponse"],
	integrateSocialAccount: GraphQLTypes["IntegrateSocialAccountResponse"]
};
	["GetOAuthInput"]: {
		scopes?: Array<string> | undefined,
	state?: string | undefined,
	redirectUri?: string | undefined
};
	["PublicUsersMutation"]: {
	__typename: "PublicUsersMutation",
	register: GraphQLTypes["RegisterResponse"],
	verifyEmail: GraphQLTypes["VerifyEmailResponse"],
	changePasswordWithToken: GraphQLTypes["ChangePasswordWithTokenResponse"],
	generateOAuthToken: GraphQLTypes["GenerateOAuthTokenResponse"]
};
	["EditUserError"]: EditUserError;
	["EditUserResponse"]: {
	__typename: "EditUserResponse",
	result?: boolean | undefined,
	hasError?: GraphQLTypes["EditUserError"] | undefined
};
	["VerifyEmailError"]: VerifyEmailError;
	["VerifyEmailResponse"]: {
	__typename: "VerifyEmailResponse",
	result?: boolean | undefined,
	hasError?: GraphQLTypes["VerifyEmailError"] | undefined
};
	["ChangePasswordWhenLoggedError"]: ChangePasswordWhenLoggedError;
	["ChangePasswordWhenLoggedResponse"]: {
	__typename: "ChangePasswordWhenLoggedResponse",
	result?: boolean | undefined,
	hasError?: GraphQLTypes["ChangePasswordWhenLoggedError"] | undefined
};
	["ChangePasswordWithTokenError"]: ChangePasswordWithTokenError;
	["ChangePasswordWithTokenResponse"]: {
	__typename: "ChangePasswordWithTokenResponse",
	result?: boolean | undefined,
	hasError?: GraphQLTypes["ChangePasswordWithTokenError"] | undefined
};
	["SquashAccountsError"]: SquashAccountsError;
	["IntegrateSocialAccountError"]: IntegrateSocialAccountError;
	["IntegrateSocialAccountResponse"]: {
	__typename: "IntegrateSocialAccountResponse",
	result?: boolean | undefined,
	hasError?: GraphQLTypes["IntegrateSocialAccountError"] | undefined
};
	["GenerateOAuthTokenError"]: GenerateOAuthTokenError;
	["GenerateOAuthTokenResponse"]: {
	__typename: "GenerateOAuthTokenResponse",
	result?: string | undefined,
	hasError?: GraphQLTypes["GenerateOAuthTokenError"] | undefined
};
	["UpdateUserInput"]: {
		username?: string | undefined,
	fullName?: string | undefined,
	avatarUrl?: string | undefined
};
	["GenerateOAuthTokenInput"]: {
		social: GraphQLTypes["SocialKind"],
	code: string
};
	["SimpleUserInput"]: {
		username: string,
	password: string
};
	["LoginInput"]: {
		username: string,
	password: string
};
	["VerifyEmailInput"]: {
		token: string
};
	["ChangePasswordWithTokenInput"]: {
		username: string,
	forgotToken: string,
	newPassword: string
};
	["ChangePasswordWhenLoggedInput"]: {
		oldPassword: string,
	newPassword: string
};
	["RegisterInput"]: {
		username: string,
	password: string,
	fullName?: string | undefined,
	invitationToken?: string | undefined
};
	["SocialKind"]: SocialKind;
	["LoginQuery"]: {
	__typename: "LoginQuery",
	password: GraphQLTypes["LoginResponse"],
	provider: GraphQLTypes["ProviderLoginQuery"],
	/** endpoint for refreshing accessToken based on refreshToken */
	refreshToken: string
};
	["ProviderLoginInput"]: {
		code: string,
	redirectUri: string
};
	["ProviderLoginQuery"]: {
	__typename: "ProviderLoginQuery",
	apple?: GraphQLTypes["ProviderResponse"] | undefined,
	google?: GraphQLTypes["ProviderResponse"] | undefined,
	github?: GraphQLTypes["ProviderResponse"] | undefined,
	microsoft?: GraphQLTypes["ProviderResponse"] | undefined
};
	["RegisterErrors"]: RegisterErrors;
	["LoginErrors"]: LoginErrors;
	["ProviderErrors"]: ProviderErrors;
	["RegisterResponse"]: {
	__typename: "RegisterResponse",
	registered?: boolean | undefined,
	hasError?: GraphQLTypes["RegisterErrors"] | undefined
};
	["LoginResponse"]: {
	__typename: "LoginResponse",
	/** same value as accessToken, for delete in future, 
improvise, adapt, overcome, frontend! */
	login?: string | undefined,
	accessToken?: string | undefined,
	refreshToken?: string | undefined,
	hasError?: GraphQLTypes["LoginErrors"] | undefined
};
	["ProviderResponse"]: {
	__typename: "ProviderResponse",
	/** same value as accessToken, for delete in future, 
improvise, adapt, overcome, frontend! */
	jwt?: string | undefined,
	accessToken?: string | undefined,
	refreshToken?: string | undefined,
	providerAccessToken?: string | undefined,
	/** field describes whether this is first login attempt for this username */
	register?: boolean | undefined,
	hasError?: GraphQLTypes["ProviderErrors"] | undefined
}
    }
export const enum SortDirection {
	ASC = "ASC",
	DESC = "DESC"
}
export const enum MessageSortFields {
	CREATED_AT = "CREATED_AT"
}
export const enum EditUserError {
	USERNAME_ALREADY_TAKEN = "USERNAME_ALREADY_TAKEN",
	FAILED_MONGO_UPDATE = "FAILED_MONGO_UPDATE",
	USER_DOES_NOT_EXIST = "USER_DOES_NOT_EXIST"
}
export const enum VerifyEmailError {
	TOKEN_CANNOT_BE_FOUND = "TOKEN_CANNOT_BE_FOUND"
}
export const enum ChangePasswordWhenLoggedError {
	CANNOT_CHANGE_PASSWORD_FOR_USER_REGISTERED_VIA_SOCIAL = "CANNOT_CHANGE_PASSWORD_FOR_USER_REGISTERED_VIA_SOCIAL",
	OLD_PASSWORD_IS_INVALID = "OLD_PASSWORD_IS_INVALID",
	PASSWORD_WEAK = "PASSWORD_WEAK"
}
export const enum ChangePasswordWithTokenError {
	CANNOT_CHANGE_PASSWORD_FOR_USER_REGISTERED_VIA_SOCIAL = "CANNOT_CHANGE_PASSWORD_FOR_USER_REGISTERED_VIA_SOCIAL",
	TOKEN_IS_INVALID = "TOKEN_IS_INVALID",
	PASSWORD_IS_TOO_WEAK = "PASSWORD_IS_TOO_WEAK"
}
export const enum SquashAccountsError {
	YOU_HAVE_ONLY_ONE_ACCOUNT = "YOU_HAVE_ONLY_ONE_ACCOUNT",
	YOUR_ACCOUNTS_DO_NOT_HAVE_CONFIRMED_EMAIL = "YOUR_ACCOUNTS_DO_NOT_HAVE_CONFIRMED_EMAIL",
	INCORRECT_PASSWORD = "INCORRECT_PASSWORD"
}
export const enum IntegrateSocialAccountError {
	YOU_HAVE_ONLY_ONE_ACCOUNT = "YOU_HAVE_ONLY_ONE_ACCOUNT",
	YOUR_ACCOUNT_DOES_NOT_HANDLE_CHANGE_PASSWORD_MODE = "YOUR_ACCOUNT_DOES_NOT_HANDLE_CHANGE_PASSWORD_MODE",
	INCORRECT_PASSWORD = "INCORRECT_PASSWORD",
	CANNOT_FIND_USER = "CANNOT_FIND_USER",
	YOUR_ACCOUNT_DOES_NOT_HAVE_CONFIRMED_EMAIL = "YOUR_ACCOUNT_DOES_NOT_HAVE_CONFIRMED_EMAIL"
}
export const enum GenerateOAuthTokenError {
	TOKEN_NOT_GENERATED = "TOKEN_NOT_GENERATED",
	CANNOT_RETRIEVE_USER_INFORMATION_FROM_APPLE = "CANNOT_RETRIEVE_USER_INFORMATION_FROM_APPLE"
}
export const enum SocialKind {
	Google = "Google",
	Github = "Github",
	Apple = "Apple",
	Microsoft = "Microsoft"
}
export const enum RegisterErrors {
	USERNAME_EXISTS = "USERNAME_EXISTS",
	PASSWORD_WEAK = "PASSWORD_WEAK",
	INVITE_DOMAIN_INCORRECT = "INVITE_DOMAIN_INCORRECT",
	LINK_EXPIRED = "LINK_EXPIRED",
	USERNAME_INVALID = "USERNAME_INVALID",
	FULLNAME_EXISTS = "FULLNAME_EXISTS"
}
export const enum LoginErrors {
	CONFIRM_EMAIL_BEFOR_LOGIN = "CONFIRM_EMAIL_BEFOR_LOGIN",
	INVALID_LOGIN_OR_PASSWORD = "INVALID_LOGIN_OR_PASSWORD",
	CANNOT_FIND_CONNECTED_USER = "CANNOT_FIND_CONNECTED_USER",
	YOU_PROVIDED_OTHER_METHOD_OF_LOGIN_ON_THIS_EMAIL = "YOU_PROVIDED_OTHER_METHOD_OF_LOGIN_ON_THIS_EMAIL",
	UNEXPECTED_ERROR = "UNEXPECTED_ERROR"
}
export const enum ProviderErrors {
	CANNOT_RETRIVE_PROFILE_FROM_GOOGLE_TRY_REFRESH_TOKEN = "CANNOT_RETRIVE_PROFILE_FROM_GOOGLE_TRY_REFRESH_TOKEN",
	CANNOT_FIND_EMAIL_FOR_THIS_PROFIL = "CANNOT_FIND_EMAIL_FOR_THIS_PROFIL",
	CANNOT_RETRIVE_USER_INFORMATION_FROM_APPLE = "CANNOT_RETRIVE_USER_INFORMATION_FROM_APPLE",
	CODE_IS_NOT_EXIST_IN_ARGS = "CODE_IS_NOT_EXIST_IN_ARGS",
	CANNOT_RETRIVE_SUB_FIELD_FROM_JWT_TOKEN = "CANNOT_RETRIVE_SUB_FIELD_FROM_JWT_TOKEN",
	CANNOT_RETRIVE_TOKEN_FROM_MICROSOFT = "CANNOT_RETRIVE_TOKEN_FROM_MICROSOFT"
}

type ZEUS_VARIABLES = {
	["PageInput"]: ValueTypes["PageInput"];
	["MessageSortByInput"]: ValueTypes["MessageSortByInput"];
	["ServersFilter"]: ValueTypes["ServersFilter"];
	["MessageInput"]: ValueTypes["MessageInput"];
	["CreateServer"]: ValueTypes["CreateServer"];
	["CreateChannelInput"]: ValueTypes["CreateChannelInput"];
	["UpdateServer"]: ValueTypes["UpdateServer"];
	["UpdateChannelInput"]: ValueTypes["UpdateChannelInput"];
	["SortDirection"]: ValueTypes["SortDirection"];
	["MessageSortFields"]: ValueTypes["MessageSortFields"];
	["GetOAuthInput"]: ValueTypes["GetOAuthInput"];
	["EditUserError"]: ValueTypes["EditUserError"];
	["VerifyEmailError"]: ValueTypes["VerifyEmailError"];
	["ChangePasswordWhenLoggedError"]: ValueTypes["ChangePasswordWhenLoggedError"];
	["ChangePasswordWithTokenError"]: ValueTypes["ChangePasswordWithTokenError"];
	["SquashAccountsError"]: ValueTypes["SquashAccountsError"];
	["IntegrateSocialAccountError"]: ValueTypes["IntegrateSocialAccountError"];
	["GenerateOAuthTokenError"]: ValueTypes["GenerateOAuthTokenError"];
	["UpdateUserInput"]: ValueTypes["UpdateUserInput"];
	["GenerateOAuthTokenInput"]: ValueTypes["GenerateOAuthTokenInput"];
	["SimpleUserInput"]: ValueTypes["SimpleUserInput"];
	["LoginInput"]: ValueTypes["LoginInput"];
	["VerifyEmailInput"]: ValueTypes["VerifyEmailInput"];
	["ChangePasswordWithTokenInput"]: ValueTypes["ChangePasswordWithTokenInput"];
	["ChangePasswordWhenLoggedInput"]: ValueTypes["ChangePasswordWhenLoggedInput"];
	["RegisterInput"]: ValueTypes["RegisterInput"];
	["SocialKind"]: ValueTypes["SocialKind"];
	["ProviderLoginInput"]: ValueTypes["ProviderLoginInput"];
	["RegisterErrors"]: ValueTypes["RegisterErrors"];
	["LoginErrors"]: ValueTypes["LoginErrors"];
	["ProviderErrors"]: ValueTypes["ProviderErrors"];
}