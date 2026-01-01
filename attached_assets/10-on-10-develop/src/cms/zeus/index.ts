/* eslint-disable */

import { AllTypesProps, ReturnTypes, Ops } from './const';
export const HOST = "https://10on10-cms.aexol.work/api/graphql/"


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
	ObjectId?: ScalarResolver;
	S3Scalar?: ScalarResolver;
	Timestamp?: ScalarResolver;
	ModelNavigationCompiled?: ScalarResolver;
	BackupFile?: ScalarResolver;
}
type ZEUS_UNIONS = never

export type ValueTypes = {
    ["VersionField"]: AliasType<{
	name?:boolean | `@${string}`,
	from?:boolean | `@${string}`,
	to?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ImageField"]: AliasType<{
	url?:boolean | `@${string}`,
	thumbnail?:boolean | `@${string}`,
	alt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["VideoField"]: AliasType<{
	url?:boolean | `@${string}`,
	previewImage?:boolean | `@${string}`,
	alt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["InternalLink"]: AliasType<{
	_id?:boolean | `@${string}`,
	keys?:boolean | `@${string}`,
	href?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["RootCMSParam"]: AliasType<{
	name?:boolean | `@${string}`,
	options?:boolean | `@${string}`,
	default?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ModelNavigation"]: AliasType<{
	name?:boolean | `@${string}`,
	display?:boolean | `@${string}`,
	fields?:ValueTypes["CMSField"],
	fieldSet?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CMSField"]: AliasType<{
	name?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	list?:boolean | `@${string}`,
	searchable?:boolean | `@${string}`,
	sortable?:boolean | `@${string}`,
	options?:boolean | `@${string}`,
	relation?:boolean | `@${string}`,
	fields?:ValueTypes["CMSField"],
	builtIn?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ObjectId"]:unknown;
	["S3Scalar"]:unknown;
	["Timestamp"]:unknown;
	["ModelNavigationCompiled"]:unknown;
	["Sort"]:Sort;
	["PageInfo"]: AliasType<{
	total?:boolean | `@${string}`,
	hasNext?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["PageInput"]: {
	limit: number | Variable<any, string>,
	start?: number | undefined | null | Variable<any, string>
};
	["ImageFieldInput"]: {
	thumbnail?: ValueTypes["S3Scalar"] | undefined | null | Variable<any, string>,
	url?: ValueTypes["S3Scalar"] | undefined | null | Variable<any, string>,
	alt?: string | undefined | null | Variable<any, string>
};
	["VideoFieldInput"]: {
	previewImage?: ValueTypes["S3Scalar"] | undefined | null | Variable<any, string>,
	url?: ValueTypes["S3Scalar"] | undefined | null | Variable<any, string>,
	alt?: string | undefined | null | Variable<any, string>
};
	["DuplicateDocumentsInput"]: {
	originalRootParams: ValueTypes["RootParamsInput"] | Variable<any, string>,
	newRootParams: ValueTypes["RootParamsInput"] | Variable<any, string>,
	resultLanguage?: ValueTypes["Languages"] | undefined | null | Variable<any, string>,
	modelName?: string | undefined | null | Variable<any, string>
};
	["AnalyticsResponse"]: AliasType<{
	date?:boolean | `@${string}`,
	value?:ValueTypes["AnalyticsModelResponse"],
		__typename?: boolean | `@${string}`
}>;
	["AnalyticsModelResponse"]: AliasType<{
	modelName?:boolean | `@${string}`,
	calls?:boolean | `@${string}`,
	rootParamsKey?:boolean | `@${string}`,
	tokens?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CreateRootCMSParam"]: {
	name: string | Variable<any, string>,
	options: Array<string> | Variable<any, string>,
	default?: string | undefined | null | Variable<any, string>
};
	["CreateVersion"]: {
	name: string | Variable<any, string>,
	from: ValueTypes["Timestamp"] | Variable<any, string>,
	to?: ValueTypes["Timestamp"] | undefined | null | Variable<any, string>
};
	["CreateInternalLink"]: {
	keys: Array<string> | Variable<any, string>,
	href: string | Variable<any, string>
};
	["FileResponse"]: AliasType<{
	key?:boolean | `@${string}`,
	cdnURL?:boolean | `@${string}`,
	modifiedAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["FileConnection"]: AliasType<{
	items?:ValueTypes["FileResponse"],
	pageInfo?:ValueTypes["PageInfo"],
		__typename?: boolean | `@${string}`
}>;
	["MediaResponse"]: AliasType<{
	key?:boolean | `@${string}`,
	cdnURL?:boolean | `@${string}`,
	thumbnailCdnURL?:boolean | `@${string}`,
	alt?:boolean | `@${string}`,
	modifiedAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["MediaConnection"]: AliasType<{
	items?:ValueTypes["MediaResponse"],
	pageInfo?:ValueTypes["PageInfo"],
		__typename?: boolean | `@${string}`
}>;
	["MediaOrderByInput"]: {
	date?: ValueTypes["Sort"] | undefined | null | Variable<any, string>
};
	["MediaParamsInput"]: {
	model?: string | undefined | null | Variable<any, string>,
	search?: string | undefined | null | Variable<any, string>,
	allowedExtensions?: Array<string> | undefined | null | Variable<any, string>,
	page?: ValueTypes["PageInput"] | undefined | null | Variable<any, string>,
	sort?: ValueTypes["MediaOrderByInput"] | undefined | null | Variable<any, string>
};
	["UploadFileInput"]: {
	key: string | Variable<any, string>,
	prefix?: string | undefined | null | Variable<any, string>,
	alt?: string | undefined | null | Variable<any, string>
};
	["UploadFileResponseBase"]: AliasType<{
	key?:boolean | `@${string}`,
	putURL?:boolean | `@${string}`,
	cdnURL?:boolean | `@${string}`,
	alt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ImageUploadResponse"]: AliasType<{
	file?:ValueTypes["UploadFileResponseBase"],
	thumbnail?:ValueTypes["UploadFileResponseBase"],
		__typename?: boolean | `@${string}`
}>;
	["InputCMSField"]: {
	name: string | Variable<any, string>,
	type: ValueTypes["CMSType"] | Variable<any, string>,
	list?: boolean | undefined | null | Variable<any, string>,
	searchable?: boolean | undefined | null | Variable<any, string>,
	sortable?: boolean | undefined | null | Variable<any, string>,
	options?: Array<string> | undefined | null | Variable<any, string>,
	relation?: string | undefined | null | Variable<any, string>,
	builtIn?: boolean | undefined | null | Variable<any, string>,
	fields?: Array<ValueTypes["InputCMSField"]> | undefined | null | Variable<any, string>
};
	["ApiKey"]: AliasType<{
	name?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	_id?:boolean | `@${string}`,
	value?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Languages"]:Languages;
	["Formality"]:Formality;
	["BackupFile"]:unknown;
	["AdminQuery"]: AliasType<{
analytics?: [{	fromDate: string | Variable<any, string>,	toDate?: string | undefined | null | Variable<any, string>},ValueTypes["AnalyticsResponse"]],
translationAnalytics?: [{	fromDate: string | Variable<any, string>,	toDate?: string | undefined | null | Variable<any, string>},ValueTypes["AnalyticsResponse"]],
	backup?:boolean | `@${string}`,
	backups?:ValueTypes["MediaResponse"],
	apiKeys?:ValueTypes["ApiKey"],
		__typename?: boolean | `@${string}`
}>;
	["GenerateContentInput"]: {
	document: string | Variable<any, string>,
	field: string | Variable<any, string>,
	description?: string | undefined | null | Variable<any, string>,
	keywords?: Array<string> | undefined | null | Variable<any, string>,
	language?: ValueTypes["Languages"] | undefined | null | Variable<any, string>
};
	["GenerateImageModel"]:GenerateImageModel;
	["GenerateImageQuality"]:GenerateImageQuality;
	["GenerateImageSize"]:GenerateImageSize;
	["GenerateImageStyle"]:GenerateImageStyle;
	["GenerateImageInput"]: {
	model: ValueTypes["GenerateImageModel"] | Variable<any, string>,
	prompt: string | Variable<any, string>,
	quality?: ValueTypes["GenerateImageQuality"] | undefined | null | Variable<any, string>,
	size: ValueTypes["GenerateImageSize"] | Variable<any, string>,
	style?: ValueTypes["GenerateImageStyle"] | undefined | null | Variable<any, string>
};
	["TranslateDocInput"]: {
	modelName: string | Variable<any, string>,
	slug: string | Variable<any, string>,
	originalRootParams: ValueTypes["RootParamsInput"] | Variable<any, string>,
	newRootParams: ValueTypes["RootParamsInput"] | Variable<any, string>,
	resultLanguages: Array<ValueTypes["Languages"]> | Variable<any, string>,
	formality?: ValueTypes["Formality"] | undefined | null | Variable<any, string>,
	context?: string | undefined | null | Variable<any, string>
};
	["Mutation"]: AliasType<{
	admin?:ValueTypes["AdminMutation"],
		__typename?: boolean | `@${string}`
}>;
	/** This enum is defined externally and injected via federation */
["CMSType"]:CMSType;
	["Query"]: AliasType<{
	navigation?:ValueTypes["ModelNavigation"],
	rootParams?:ValueTypes["RootCMSParam"],
	versions?:ValueTypes["VersionField"],
	links?:ValueTypes["InternalLink"],
	admin?:ValueTypes["AdminQuery"],
	isLoggedIn?:boolean | `@${string}`,
	logoURL?:boolean | `@${string}`,
listcategory?: [{	rootParams?: ValueTypes["RootParamsInput"] | undefined | null | Variable<any, string>},ValueTypes["category"]],
listPaginatedcategory?: [{	page: ValueTypes["PageInput"] | Variable<any, string>,	rootParams?: ValueTypes["RootParamsInput"] | undefined | null | Variable<any, string>,	search?: string | undefined | null | Variable<any, string>,	sort?: ValueTypes["categorySortInput"] | undefined | null | Variable<any, string>},ValueTypes["category__Connection"]],
onecategoryBySlug?: [{	slug: string | Variable<any, string>,	rootParams?: ValueTypes["RootParamsInput"] | undefined | null | Variable<any, string>},ValueTypes["category"]],
variantscategoryBySlug?: [{	slug: string | Variable<any, string>},ValueTypes["category"]],
	fieldSetcategory?:boolean | `@${string}`,
	modelcategory?:boolean | `@${string}`,
listpolicy?: [{	rootParams?: ValueTypes["RootParamsInput"] | undefined | null | Variable<any, string>},ValueTypes["policy"]],
listPaginatedpolicy?: [{	page: ValueTypes["PageInput"] | Variable<any, string>,	rootParams?: ValueTypes["RootParamsInput"] | undefined | null | Variable<any, string>,	search?: string | undefined | null | Variable<any, string>,	sort?: ValueTypes["policySortInput"] | undefined | null | Variable<any, string>},ValueTypes["policy__Connection"]],
onepolicyBySlug?: [{	slug: string | Variable<any, string>,	rootParams?: ValueTypes["RootParamsInput"] | undefined | null | Variable<any, string>},ValueTypes["policy"]],
variantspolicyBySlug?: [{	slug: string | Variable<any, string>},ValueTypes["policy"]],
	fieldSetpolicy?:boolean | `@${string}`,
	modelpolicy?:boolean | `@${string}`,
mediaQuery?: [{	mediaParams?: ValueTypes["MediaParamsInput"] | undefined | null | Variable<any, string>,	rootParams?: ValueTypes["RootParamsInput"] | undefined | null | Variable<any, string>},ValueTypes["MediaConnection"]],
filesQuery?: [{	mediaParams?: ValueTypes["MediaParamsInput"] | undefined | null | Variable<any, string>,	rootParams?: ValueTypes["RootParamsInput"] | undefined | null | Variable<any, string>},ValueTypes["FileConnection"]],
		__typename?: boolean | `@${string}`
}>;
	["AdminMutation"]: AliasType<{
upsertModel?: [{	modelName?: string | undefined | null | Variable<any, string>,	fields: Array<ValueTypes["InputCMSField"]> | Variable<any, string>},boolean | `@${string}`],
removeModel?: [{	modelName: string | Variable<any, string>},boolean | `@${string}`],
upsertVersion?: [{	version: ValueTypes["CreateVersion"] | Variable<any, string>},boolean | `@${string}`],
removeVersion?: [{	name: string | Variable<any, string>},boolean | `@${string}`],
upsertInternalLink?: [{	link: ValueTypes["CreateInternalLink"] | Variable<any, string>},boolean | `@${string}`],
removeInternalLink?: [{	href: string | Variable<any, string>},boolean | `@${string}`],
upsertParam?: [{	param: ValueTypes["CreateRootCMSParam"] | Variable<any, string>},boolean | `@${string}`],
removeParam?: [{	name: string | Variable<any, string>},boolean | `@${string}`],
uploadFile?: [{	file: ValueTypes["UploadFileInput"] | Variable<any, string>},ValueTypes["UploadFileResponseBase"]],
uploadImage?: [{	file: ValueTypes["UploadFileInput"] | Variable<any, string>},ValueTypes["ImageUploadResponse"]],
removeFiles?: [{	keys: Array<string> | Variable<any, string>},boolean | `@${string}`],
restore?: [{	backup?: ValueTypes["BackupFile"] | undefined | null | Variable<any, string>},boolean | `@${string}`],
generateApiKey?: [{	name: string | Variable<any, string>},boolean | `@${string}`],
revokeApiKey?: [{	name: string | Variable<any, string>},boolean | `@${string}`],
translateDocument?: [{	param: ValueTypes["TranslateDocInput"] | Variable<any, string>},boolean | `@${string}`],
generateContent?: [{	input: ValueTypes["GenerateContentInput"] | Variable<any, string>},boolean | `@${string}`],
generateImage?: [{	input: ValueTypes["GenerateImageInput"] | Variable<any, string>},boolean | `@${string}`],
changeLogo?: [{	logoURL: string | Variable<any, string>},boolean | `@${string}`],
	removeLogo?:boolean | `@${string}`,
duplicateDocuments?: [{	params: ValueTypes["DuplicateDocumentsInput"] | Variable<any, string>},boolean | `@${string}`],
upsertcategory?: [{	slug: string | Variable<any, string>,	category?: ValueTypes["Modifycategory"] | undefined | null | Variable<any, string>,	draft_version?: boolean | undefined | null | Variable<any, string>,	rootParams?: ValueTypes["RootParamsInput"] | undefined | null | Variable<any, string>},boolean | `@${string}`],
removecategory?: [{	slug: string | Variable<any, string>,	rootParams?: ValueTypes["RootParamsInput"] | undefined | null | Variable<any, string>},boolean | `@${string}`],
duplicatecategory?: [{	oldSlug: string | Variable<any, string>,	newSlug: string | Variable<any, string>,	rootParams?: ValueTypes["RootParamsInput"] | undefined | null | Variable<any, string>},boolean | `@${string}`],
upsertpolicy?: [{	slug: string | Variable<any, string>,	policy?: ValueTypes["Modifypolicy"] | undefined | null | Variable<any, string>,	draft_version?: boolean | undefined | null | Variable<any, string>,	rootParams?: ValueTypes["RootParamsInput"] | undefined | null | Variable<any, string>},boolean | `@${string}`],
removepolicy?: [{	slug: string | Variable<any, string>,	rootParams?: ValueTypes["RootParamsInput"] | undefined | null | Variable<any, string>},boolean | `@${string}`],
duplicatepolicy?: [{	oldSlug: string | Variable<any, string>,	newSlug: string | Variable<any, string>,	rootParams?: ValueTypes["RootParamsInput"] | undefined | null | Variable<any, string>},boolean | `@${string}`],
		__typename?: boolean | `@${string}`
}>;
	["category"]: AliasType<{
	_version?:ValueTypes["VersionField"],
	name?:boolean | `@${string}`,
	img?:ValueTypes["ImageField"],
	avatar?:ValueTypes["ImageField"],
	slug?:boolean | `@${string}`,
	_id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	draft_version?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["category__Connection"]: AliasType<{
	items?:ValueTypes["category"],
	pageInfo?:ValueTypes["PageInfo"],
		__typename?: boolean | `@${string}`
}>;
	["policy"]: AliasType<{
	_version?:ValueTypes["VersionField"],
	title?:boolean | `@${string}`,
	body?:boolean | `@${string}`,
	slug?:boolean | `@${string}`,
	_id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	draft_version?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["policy__Connection"]: AliasType<{
	items?:ValueTypes["policy"],
	pageInfo?:ValueTypes["PageInfo"],
		__typename?: boolean | `@${string}`
}>;
	["Modifycategory"]: {
	_version?: ValueTypes["CreateVersion"] | undefined | null | Variable<any, string>,
	name?: string | undefined | null | Variable<any, string>,
	img?: ValueTypes["ImageFieldInput"] | undefined | null | Variable<any, string>,
	avatar?: ValueTypes["ImageFieldInput"] | undefined | null | Variable<any, string>,
	slug?: string | undefined | null | Variable<any, string>,
	createdAt?: number | undefined | null | Variable<any, string>,
	updatedAt?: number | undefined | null | Variable<any, string>,
	draft_version?: boolean | undefined | null | Variable<any, string>
};
	["Modifypolicy"]: {
	_version?: ValueTypes["CreateVersion"] | undefined | null | Variable<any, string>,
	title?: string | undefined | null | Variable<any, string>,
	body?: string | undefined | null | Variable<any, string>,
	slug?: string | undefined | null | Variable<any, string>,
	createdAt?: number | undefined | null | Variable<any, string>,
	updatedAt?: number | undefined | null | Variable<any, string>,
	draft_version?: boolean | undefined | null | Variable<any, string>
};
	["RootParamsInput"]: {
	_version?: string | undefined | null | Variable<any, string>
};
	["categorySortInput"]: {
	slug?: ValueTypes["Sort"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["Sort"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["Sort"] | undefined | null | Variable<any, string>
};
	["policySortInput"]: {
	slug?: ValueTypes["Sort"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["Sort"] | undefined | null | Variable<any, string>,
	updatedAt?: ValueTypes["Sort"] | undefined | null | Variable<any, string>
}
  }

export type ResolverInputTypes = {
    ["VersionField"]: AliasType<{
	name?:boolean | `@${string}`,
	from?:boolean | `@${string}`,
	to?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ImageField"]: AliasType<{
	url?:boolean | `@${string}`,
	thumbnail?:boolean | `@${string}`,
	alt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["VideoField"]: AliasType<{
	url?:boolean | `@${string}`,
	previewImage?:boolean | `@${string}`,
	alt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["InternalLink"]: AliasType<{
	_id?:boolean | `@${string}`,
	keys?:boolean | `@${string}`,
	href?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["RootCMSParam"]: AliasType<{
	name?:boolean | `@${string}`,
	options?:boolean | `@${string}`,
	default?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ModelNavigation"]: AliasType<{
	name?:boolean | `@${string}`,
	display?:boolean | `@${string}`,
	fields?:ResolverInputTypes["CMSField"],
	fieldSet?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CMSField"]: AliasType<{
	name?:boolean | `@${string}`,
	type?:boolean | `@${string}`,
	list?:boolean | `@${string}`,
	searchable?:boolean | `@${string}`,
	sortable?:boolean | `@${string}`,
	options?:boolean | `@${string}`,
	relation?:boolean | `@${string}`,
	fields?:ResolverInputTypes["CMSField"],
	builtIn?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ObjectId"]:unknown;
	["S3Scalar"]:unknown;
	["Timestamp"]:unknown;
	["ModelNavigationCompiled"]:unknown;
	["Sort"]:Sort;
	["PageInfo"]: AliasType<{
	total?:boolean | `@${string}`,
	hasNext?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["PageInput"]: {
	limit: number,
	start?: number | undefined | null
};
	["ImageFieldInput"]: {
	thumbnail?: ResolverInputTypes["S3Scalar"] | undefined | null,
	url?: ResolverInputTypes["S3Scalar"] | undefined | null,
	alt?: string | undefined | null
};
	["VideoFieldInput"]: {
	previewImage?: ResolverInputTypes["S3Scalar"] | undefined | null,
	url?: ResolverInputTypes["S3Scalar"] | undefined | null,
	alt?: string | undefined | null
};
	["DuplicateDocumentsInput"]: {
	originalRootParams: ResolverInputTypes["RootParamsInput"],
	newRootParams: ResolverInputTypes["RootParamsInput"],
	resultLanguage?: ResolverInputTypes["Languages"] | undefined | null,
	modelName?: string | undefined | null
};
	["AnalyticsResponse"]: AliasType<{
	date?:boolean | `@${string}`,
	value?:ResolverInputTypes["AnalyticsModelResponse"],
		__typename?: boolean | `@${string}`
}>;
	["AnalyticsModelResponse"]: AliasType<{
	modelName?:boolean | `@${string}`,
	calls?:boolean | `@${string}`,
	rootParamsKey?:boolean | `@${string}`,
	tokens?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["CreateRootCMSParam"]: {
	name: string,
	options: Array<string>,
	default?: string | undefined | null
};
	["CreateVersion"]: {
	name: string,
	from: ResolverInputTypes["Timestamp"],
	to?: ResolverInputTypes["Timestamp"] | undefined | null
};
	["CreateInternalLink"]: {
	keys: Array<string>,
	href: string
};
	["FileResponse"]: AliasType<{
	key?:boolean | `@${string}`,
	cdnURL?:boolean | `@${string}`,
	modifiedAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["FileConnection"]: AliasType<{
	items?:ResolverInputTypes["FileResponse"],
	pageInfo?:ResolverInputTypes["PageInfo"],
		__typename?: boolean | `@${string}`
}>;
	["MediaResponse"]: AliasType<{
	key?:boolean | `@${string}`,
	cdnURL?:boolean | `@${string}`,
	thumbnailCdnURL?:boolean | `@${string}`,
	alt?:boolean | `@${string}`,
	modifiedAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["MediaConnection"]: AliasType<{
	items?:ResolverInputTypes["MediaResponse"],
	pageInfo?:ResolverInputTypes["PageInfo"],
		__typename?: boolean | `@${string}`
}>;
	["MediaOrderByInput"]: {
	date?: ResolverInputTypes["Sort"] | undefined | null
};
	["MediaParamsInput"]: {
	model?: string | undefined | null,
	search?: string | undefined | null,
	allowedExtensions?: Array<string> | undefined | null,
	page?: ResolverInputTypes["PageInput"] | undefined | null,
	sort?: ResolverInputTypes["MediaOrderByInput"] | undefined | null
};
	["UploadFileInput"]: {
	key: string,
	prefix?: string | undefined | null,
	alt?: string | undefined | null
};
	["UploadFileResponseBase"]: AliasType<{
	key?:boolean | `@${string}`,
	putURL?:boolean | `@${string}`,
	cdnURL?:boolean | `@${string}`,
	alt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ImageUploadResponse"]: AliasType<{
	file?:ResolverInputTypes["UploadFileResponseBase"],
	thumbnail?:ResolverInputTypes["UploadFileResponseBase"],
		__typename?: boolean | `@${string}`
}>;
	["InputCMSField"]: {
	name: string,
	type: ResolverInputTypes["CMSType"],
	list?: boolean | undefined | null,
	searchable?: boolean | undefined | null,
	sortable?: boolean | undefined | null,
	options?: Array<string> | undefined | null,
	relation?: string | undefined | null,
	builtIn?: boolean | undefined | null,
	fields?: Array<ResolverInputTypes["InputCMSField"]> | undefined | null
};
	["ApiKey"]: AliasType<{
	name?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	_id?:boolean | `@${string}`,
	value?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Languages"]:Languages;
	["Formality"]:Formality;
	["BackupFile"]:unknown;
	["AdminQuery"]: AliasType<{
analytics?: [{	fromDate: string,	toDate?: string | undefined | null},ResolverInputTypes["AnalyticsResponse"]],
translationAnalytics?: [{	fromDate: string,	toDate?: string | undefined | null},ResolverInputTypes["AnalyticsResponse"]],
	backup?:boolean | `@${string}`,
	backups?:ResolverInputTypes["MediaResponse"],
	apiKeys?:ResolverInputTypes["ApiKey"],
		__typename?: boolean | `@${string}`
}>;
	["GenerateContentInput"]: {
	document: string,
	field: string,
	description?: string | undefined | null,
	keywords?: Array<string> | undefined | null,
	language?: ResolverInputTypes["Languages"] | undefined | null
};
	["GenerateImageModel"]:GenerateImageModel;
	["GenerateImageQuality"]:GenerateImageQuality;
	["GenerateImageSize"]:GenerateImageSize;
	["GenerateImageStyle"]:GenerateImageStyle;
	["GenerateImageInput"]: {
	model: ResolverInputTypes["GenerateImageModel"],
	prompt: string,
	quality?: ResolverInputTypes["GenerateImageQuality"] | undefined | null,
	size: ResolverInputTypes["GenerateImageSize"],
	style?: ResolverInputTypes["GenerateImageStyle"] | undefined | null
};
	["TranslateDocInput"]: {
	modelName: string,
	slug: string,
	originalRootParams: ResolverInputTypes["RootParamsInput"],
	newRootParams: ResolverInputTypes["RootParamsInput"],
	resultLanguages: Array<ResolverInputTypes["Languages"]>,
	formality?: ResolverInputTypes["Formality"] | undefined | null,
	context?: string | undefined | null
};
	["Mutation"]: AliasType<{
	admin?:ResolverInputTypes["AdminMutation"],
		__typename?: boolean | `@${string}`
}>;
	/** This enum is defined externally and injected via federation */
["CMSType"]:CMSType;
	["Query"]: AliasType<{
	navigation?:ResolverInputTypes["ModelNavigation"],
	rootParams?:ResolverInputTypes["RootCMSParam"],
	versions?:ResolverInputTypes["VersionField"],
	links?:ResolverInputTypes["InternalLink"],
	admin?:ResolverInputTypes["AdminQuery"],
	isLoggedIn?:boolean | `@${string}`,
	logoURL?:boolean | `@${string}`,
listcategory?: [{	rootParams?: ResolverInputTypes["RootParamsInput"] | undefined | null},ResolverInputTypes["category"]],
listPaginatedcategory?: [{	page: ResolverInputTypes["PageInput"],	rootParams?: ResolverInputTypes["RootParamsInput"] | undefined | null,	search?: string | undefined | null,	sort?: ResolverInputTypes["categorySortInput"] | undefined | null},ResolverInputTypes["category__Connection"]],
onecategoryBySlug?: [{	slug: string,	rootParams?: ResolverInputTypes["RootParamsInput"] | undefined | null},ResolverInputTypes["category"]],
variantscategoryBySlug?: [{	slug: string},ResolverInputTypes["category"]],
	fieldSetcategory?:boolean | `@${string}`,
	modelcategory?:boolean | `@${string}`,
listpolicy?: [{	rootParams?: ResolverInputTypes["RootParamsInput"] | undefined | null},ResolverInputTypes["policy"]],
listPaginatedpolicy?: [{	page: ResolverInputTypes["PageInput"],	rootParams?: ResolverInputTypes["RootParamsInput"] | undefined | null,	search?: string | undefined | null,	sort?: ResolverInputTypes["policySortInput"] | undefined | null},ResolverInputTypes["policy__Connection"]],
onepolicyBySlug?: [{	slug: string,	rootParams?: ResolverInputTypes["RootParamsInput"] | undefined | null},ResolverInputTypes["policy"]],
variantspolicyBySlug?: [{	slug: string},ResolverInputTypes["policy"]],
	fieldSetpolicy?:boolean | `@${string}`,
	modelpolicy?:boolean | `@${string}`,
mediaQuery?: [{	mediaParams?: ResolverInputTypes["MediaParamsInput"] | undefined | null,	rootParams?: ResolverInputTypes["RootParamsInput"] | undefined | null},ResolverInputTypes["MediaConnection"]],
filesQuery?: [{	mediaParams?: ResolverInputTypes["MediaParamsInput"] | undefined | null,	rootParams?: ResolverInputTypes["RootParamsInput"] | undefined | null},ResolverInputTypes["FileConnection"]],
		__typename?: boolean | `@${string}`
}>;
	["AdminMutation"]: AliasType<{
upsertModel?: [{	modelName?: string | undefined | null,	fields: Array<ResolverInputTypes["InputCMSField"]>},boolean | `@${string}`],
removeModel?: [{	modelName: string},boolean | `@${string}`],
upsertVersion?: [{	version: ResolverInputTypes["CreateVersion"]},boolean | `@${string}`],
removeVersion?: [{	name: string},boolean | `@${string}`],
upsertInternalLink?: [{	link: ResolverInputTypes["CreateInternalLink"]},boolean | `@${string}`],
removeInternalLink?: [{	href: string},boolean | `@${string}`],
upsertParam?: [{	param: ResolverInputTypes["CreateRootCMSParam"]},boolean | `@${string}`],
removeParam?: [{	name: string},boolean | `@${string}`],
uploadFile?: [{	file: ResolverInputTypes["UploadFileInput"]},ResolverInputTypes["UploadFileResponseBase"]],
uploadImage?: [{	file: ResolverInputTypes["UploadFileInput"]},ResolverInputTypes["ImageUploadResponse"]],
removeFiles?: [{	keys: Array<string>},boolean | `@${string}`],
restore?: [{	backup?: ResolverInputTypes["BackupFile"] | undefined | null},boolean | `@${string}`],
generateApiKey?: [{	name: string},boolean | `@${string}`],
revokeApiKey?: [{	name: string},boolean | `@${string}`],
translateDocument?: [{	param: ResolverInputTypes["TranslateDocInput"]},boolean | `@${string}`],
generateContent?: [{	input: ResolverInputTypes["GenerateContentInput"]},boolean | `@${string}`],
generateImage?: [{	input: ResolverInputTypes["GenerateImageInput"]},boolean | `@${string}`],
changeLogo?: [{	logoURL: string},boolean | `@${string}`],
	removeLogo?:boolean | `@${string}`,
duplicateDocuments?: [{	params: ResolverInputTypes["DuplicateDocumentsInput"]},boolean | `@${string}`],
upsertcategory?: [{	slug: string,	category?: ResolverInputTypes["Modifycategory"] | undefined | null,	draft_version?: boolean | undefined | null,	rootParams?: ResolverInputTypes["RootParamsInput"] | undefined | null},boolean | `@${string}`],
removecategory?: [{	slug: string,	rootParams?: ResolverInputTypes["RootParamsInput"] | undefined | null},boolean | `@${string}`],
duplicatecategory?: [{	oldSlug: string,	newSlug: string,	rootParams?: ResolverInputTypes["RootParamsInput"] | undefined | null},boolean | `@${string}`],
upsertpolicy?: [{	slug: string,	policy?: ResolverInputTypes["Modifypolicy"] | undefined | null,	draft_version?: boolean | undefined | null,	rootParams?: ResolverInputTypes["RootParamsInput"] | undefined | null},boolean | `@${string}`],
removepolicy?: [{	slug: string,	rootParams?: ResolverInputTypes["RootParamsInput"] | undefined | null},boolean | `@${string}`],
duplicatepolicy?: [{	oldSlug: string,	newSlug: string,	rootParams?: ResolverInputTypes["RootParamsInput"] | undefined | null},boolean | `@${string}`],
		__typename?: boolean | `@${string}`
}>;
	["category"]: AliasType<{
	_version?:ResolverInputTypes["VersionField"],
	name?:boolean | `@${string}`,
	img?:ResolverInputTypes["ImageField"],
	avatar?:ResolverInputTypes["ImageField"],
	slug?:boolean | `@${string}`,
	_id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	draft_version?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["category__Connection"]: AliasType<{
	items?:ResolverInputTypes["category"],
	pageInfo?:ResolverInputTypes["PageInfo"],
		__typename?: boolean | `@${string}`
}>;
	["policy"]: AliasType<{
	_version?:ResolverInputTypes["VersionField"],
	title?:boolean | `@${string}`,
	body?:boolean | `@${string}`,
	slug?:boolean | `@${string}`,
	_id?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
	draft_version?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["policy__Connection"]: AliasType<{
	items?:ResolverInputTypes["policy"],
	pageInfo?:ResolverInputTypes["PageInfo"],
		__typename?: boolean | `@${string}`
}>;
	["Modifycategory"]: {
	_version?: ResolverInputTypes["CreateVersion"] | undefined | null,
	name?: string | undefined | null,
	img?: ResolverInputTypes["ImageFieldInput"] | undefined | null,
	avatar?: ResolverInputTypes["ImageFieldInput"] | undefined | null,
	slug?: string | undefined | null,
	createdAt?: number | undefined | null,
	updatedAt?: number | undefined | null,
	draft_version?: boolean | undefined | null
};
	["Modifypolicy"]: {
	_version?: ResolverInputTypes["CreateVersion"] | undefined | null,
	title?: string | undefined | null,
	body?: string | undefined | null,
	slug?: string | undefined | null,
	createdAt?: number | undefined | null,
	updatedAt?: number | undefined | null,
	draft_version?: boolean | undefined | null
};
	["RootParamsInput"]: {
	_version?: string | undefined | null
};
	["categorySortInput"]: {
	slug?: ResolverInputTypes["Sort"] | undefined | null,
	createdAt?: ResolverInputTypes["Sort"] | undefined | null,
	updatedAt?: ResolverInputTypes["Sort"] | undefined | null
};
	["policySortInput"]: {
	slug?: ResolverInputTypes["Sort"] | undefined | null,
	createdAt?: ResolverInputTypes["Sort"] | undefined | null,
	updatedAt?: ResolverInputTypes["Sort"] | undefined | null
};
	["schema"]: AliasType<{
	query?:ResolverInputTypes["Query"],
	mutation?:ResolverInputTypes["Mutation"],
		__typename?: boolean | `@${string}`
}>
  }

export type ModelTypes = {
    ["VersionField"]: {
		name: string,
	from: ModelTypes["Timestamp"],
	to?: ModelTypes["Timestamp"] | undefined
};
	["ImageField"]: {
		url?: ModelTypes["S3Scalar"] | undefined,
	thumbnail?: ModelTypes["S3Scalar"] | undefined,
	alt?: string | undefined
};
	["VideoField"]: {
		url?: ModelTypes["S3Scalar"] | undefined,
	previewImage?: ModelTypes["S3Scalar"] | undefined,
	alt?: string | undefined
};
	["InternalLink"]: {
		_id: ModelTypes["ObjectId"],
	keys: Array<string>,
	href: string
};
	["RootCMSParam"]: {
		name: string,
	options: Array<string>,
	default?: string | undefined
};
	["ModelNavigation"]: {
		name: string,
	display: string,
	fields: Array<ModelTypes["CMSField"]>,
	fieldSet: string
};
	["CMSField"]: {
		name: string,
	type: ModelTypes["CMSType"],
	list?: boolean | undefined,
	searchable?: boolean | undefined,
	sortable?: boolean | undefined,
	options?: Array<string> | undefined,
	relation?: string | undefined,
	fields?: Array<ModelTypes["CMSField"]> | undefined,
	builtIn?: boolean | undefined
};
	["ObjectId"]:any;
	["S3Scalar"]:any;
	["Timestamp"]:any;
	["ModelNavigationCompiled"]:any;
	["Sort"]:Sort;
	["PageInfo"]: {
		total: number,
	hasNext?: boolean | undefined
};
	["PageInput"]: {
	limit: number,
	start?: number | undefined
};
	["ImageFieldInput"]: {
	thumbnail?: ModelTypes["S3Scalar"] | undefined,
	url?: ModelTypes["S3Scalar"] | undefined,
	alt?: string | undefined
};
	["VideoFieldInput"]: {
	previewImage?: ModelTypes["S3Scalar"] | undefined,
	url?: ModelTypes["S3Scalar"] | undefined,
	alt?: string | undefined
};
	["DuplicateDocumentsInput"]: {
	originalRootParams: ModelTypes["RootParamsInput"],
	newRootParams: ModelTypes["RootParamsInput"],
	resultLanguage?: ModelTypes["Languages"] | undefined,
	modelName?: string | undefined
};
	["AnalyticsResponse"]: {
		date?: string | undefined,
	value?: Array<ModelTypes["AnalyticsModelResponse"]> | undefined
};
	["AnalyticsModelResponse"]: {
		modelName: string,
	calls: number,
	rootParamsKey?: string | undefined,
	tokens?: number | undefined
};
	["CreateRootCMSParam"]: {
	name: string,
	options: Array<string>,
	default?: string | undefined
};
	["CreateVersion"]: {
	name: string,
	from: ModelTypes["Timestamp"],
	to?: ModelTypes["Timestamp"] | undefined
};
	["CreateInternalLink"]: {
	keys: Array<string>,
	href: string
};
	["FileResponse"]: {
		key: string,
	cdnURL: string,
	modifiedAt?: string | undefined
};
	["FileConnection"]: {
		items: Array<ModelTypes["FileResponse"] | undefined>,
	pageInfo?: ModelTypes["PageInfo"] | undefined
};
	["MediaResponse"]: {
		key?: string | undefined,
	cdnURL?: string | undefined,
	thumbnailCdnURL?: string | undefined,
	alt?: string | undefined,
	modifiedAt?: string | undefined
};
	["MediaConnection"]: {
		items: Array<ModelTypes["MediaResponse"] | undefined>,
	pageInfo?: ModelTypes["PageInfo"] | undefined
};
	["MediaOrderByInput"]: {
	date?: ModelTypes["Sort"] | undefined
};
	["MediaParamsInput"]: {
	model?: string | undefined,
	search?: string | undefined,
	allowedExtensions?: Array<string> | undefined,
	page?: ModelTypes["PageInput"] | undefined,
	sort?: ModelTypes["MediaOrderByInput"] | undefined
};
	["UploadFileInput"]: {
	key: string,
	prefix?: string | undefined,
	alt?: string | undefined
};
	["UploadFileResponseBase"]: {
		key: string,
	putURL: string,
	cdnURL: string,
	alt?: string | undefined
};
	["ImageUploadResponse"]: {
		file: ModelTypes["UploadFileResponseBase"],
	thumbnail: ModelTypes["UploadFileResponseBase"]
};
	["InputCMSField"]: {
	name: string,
	type: ModelTypes["CMSType"],
	list?: boolean | undefined,
	searchable?: boolean | undefined,
	sortable?: boolean | undefined,
	options?: Array<string> | undefined,
	relation?: string | undefined,
	builtIn?: boolean | undefined,
	fields?: Array<ModelTypes["InputCMSField"]> | undefined
};
	["ApiKey"]: {
		name: string,
	createdAt: string,
	_id: ModelTypes["ObjectId"],
	value: string
};
	["Languages"]:Languages;
	["Formality"]:Formality;
	["BackupFile"]:any;
	["AdminQuery"]: {
		analytics?: Array<ModelTypes["AnalyticsResponse"]> | undefined,
	translationAnalytics?: Array<ModelTypes["AnalyticsResponse"]> | undefined,
	backup?: boolean | undefined,
	backups?: Array<ModelTypes["MediaResponse"]> | undefined,
	apiKeys?: Array<ModelTypes["ApiKey"]> | undefined
};
	["GenerateContentInput"]: {
	document: string,
	field: string,
	description?: string | undefined,
	keywords?: Array<string> | undefined,
	language?: ModelTypes["Languages"] | undefined
};
	["GenerateImageModel"]:GenerateImageModel;
	["GenerateImageQuality"]:GenerateImageQuality;
	["GenerateImageSize"]:GenerateImageSize;
	["GenerateImageStyle"]:GenerateImageStyle;
	["GenerateImageInput"]: {
	model: ModelTypes["GenerateImageModel"],
	prompt: string,
	quality?: ModelTypes["GenerateImageQuality"] | undefined,
	size: ModelTypes["GenerateImageSize"],
	style?: ModelTypes["GenerateImageStyle"] | undefined
};
	["TranslateDocInput"]: {
	modelName: string,
	slug: string,
	originalRootParams: ModelTypes["RootParamsInput"],
	newRootParams: ModelTypes["RootParamsInput"],
	resultLanguages: Array<ModelTypes["Languages"]>,
	formality?: ModelTypes["Formality"] | undefined,
	context?: string | undefined
};
	["Mutation"]: {
		admin?: ModelTypes["AdminMutation"] | undefined
};
	["CMSType"]:CMSType;
	["Query"]: {
		navigation?: Array<ModelTypes["ModelNavigation"]> | undefined,
	rootParams?: Array<ModelTypes["RootCMSParam"]> | undefined,
	versions?: Array<ModelTypes["VersionField"]> | undefined,
	links?: Array<ModelTypes["InternalLink"]> | undefined,
	admin?: ModelTypes["AdminQuery"] | undefined,
	isLoggedIn?: boolean | undefined,
	logoURL?: string | undefined,
	listcategory?: Array<ModelTypes["category"]> | undefined,
	listPaginatedcategory?: ModelTypes["category__Connection"] | undefined,
	onecategoryBySlug?: ModelTypes["category"] | undefined,
	variantscategoryBySlug?: Array<ModelTypes["category"]> | undefined,
	fieldSetcategory: string,
	modelcategory: ModelTypes["ModelNavigationCompiled"],
	listpolicy?: Array<ModelTypes["policy"]> | undefined,
	listPaginatedpolicy?: ModelTypes["policy__Connection"] | undefined,
	onepolicyBySlug?: ModelTypes["policy"] | undefined,
	variantspolicyBySlug?: Array<ModelTypes["policy"]> | undefined,
	fieldSetpolicy: string,
	modelpolicy: ModelTypes["ModelNavigationCompiled"],
	mediaQuery: ModelTypes["MediaConnection"],
	filesQuery: ModelTypes["FileConnection"]
};
	["AdminMutation"]: {
		upsertModel?: boolean | undefined,
	removeModel?: boolean | undefined,
	upsertVersion?: boolean | undefined,
	removeVersion?: boolean | undefined,
	upsertInternalLink?: boolean | undefined,
	removeInternalLink?: boolean | undefined,
	upsertParam?: boolean | undefined,
	removeParam?: boolean | undefined,
	uploadFile?: ModelTypes["UploadFileResponseBase"] | undefined,
	uploadImage?: ModelTypes["ImageUploadResponse"] | undefined,
	removeFiles?: boolean | undefined,
	restore?: boolean | undefined,
	generateApiKey?: boolean | undefined,
	revokeApiKey?: boolean | undefined,
	translateDocument?: boolean | undefined,
	generateContent: string,
	generateImage: string,
	changeLogo?: boolean | undefined,
	removeLogo?: boolean | undefined,
	duplicateDocuments?: boolean | undefined,
	upsertcategory?: boolean | undefined,
	removecategory?: boolean | undefined,
	duplicatecategory?: boolean | undefined,
	upsertpolicy?: boolean | undefined,
	removepolicy?: boolean | undefined,
	duplicatepolicy?: boolean | undefined
};
	["category"]: {
		_version?: ModelTypes["VersionField"] | undefined,
	name?: string | undefined,
	img?: ModelTypes["ImageField"] | undefined,
	avatar?: ModelTypes["ImageField"] | undefined,
	slug?: string | undefined,
	_id: string,
	createdAt?: number | undefined,
	updatedAt?: number | undefined,
	draft_version?: boolean | undefined
};
	["category__Connection"]: {
		items?: Array<ModelTypes["category"]> | undefined,
	pageInfo: ModelTypes["PageInfo"]
};
	["policy"]: {
		_version?: ModelTypes["VersionField"] | undefined,
	title?: string | undefined,
	body?: string | undefined,
	slug?: string | undefined,
	_id: string,
	createdAt?: number | undefined,
	updatedAt?: number | undefined,
	draft_version?: boolean | undefined
};
	["policy__Connection"]: {
		items?: Array<ModelTypes["policy"]> | undefined,
	pageInfo: ModelTypes["PageInfo"]
};
	["Modifycategory"]: {
	_version?: ModelTypes["CreateVersion"] | undefined,
	name?: string | undefined,
	img?: ModelTypes["ImageFieldInput"] | undefined,
	avatar?: ModelTypes["ImageFieldInput"] | undefined,
	slug?: string | undefined,
	createdAt?: number | undefined,
	updatedAt?: number | undefined,
	draft_version?: boolean | undefined
};
	["Modifypolicy"]: {
	_version?: ModelTypes["CreateVersion"] | undefined,
	title?: string | undefined,
	body?: string | undefined,
	slug?: string | undefined,
	createdAt?: number | undefined,
	updatedAt?: number | undefined,
	draft_version?: boolean | undefined
};
	["RootParamsInput"]: {
	_version?: string | undefined
};
	["categorySortInput"]: {
	slug?: ModelTypes["Sort"] | undefined,
	createdAt?: ModelTypes["Sort"] | undefined,
	updatedAt?: ModelTypes["Sort"] | undefined
};
	["policySortInput"]: {
	slug?: ModelTypes["Sort"] | undefined,
	createdAt?: ModelTypes["Sort"] | undefined,
	updatedAt?: ModelTypes["Sort"] | undefined
};
	["schema"]: {
	query?: ModelTypes["Query"] | undefined,
	mutation?: ModelTypes["Mutation"] | undefined
}
    }

export type GraphQLTypes = {
    ["VersionField"]: {
	__typename: "VersionField",
	name: string,
	from: GraphQLTypes["Timestamp"],
	to?: GraphQLTypes["Timestamp"] | undefined
};
	["ImageField"]: {
	__typename: "ImageField",
	url?: GraphQLTypes["S3Scalar"] | undefined,
	thumbnail?: GraphQLTypes["S3Scalar"] | undefined,
	alt?: string | undefined
};
	["VideoField"]: {
	__typename: "VideoField",
	url?: GraphQLTypes["S3Scalar"] | undefined,
	previewImage?: GraphQLTypes["S3Scalar"] | undefined,
	alt?: string | undefined
};
	["InternalLink"]: {
	__typename: "InternalLink",
	_id: GraphQLTypes["ObjectId"],
	keys: Array<string>,
	href: string
};
	["RootCMSParam"]: {
	__typename: "RootCMSParam",
	name: string,
	options: Array<string>,
	default?: string | undefined
};
	["ModelNavigation"]: {
	__typename: "ModelNavigation",
	name: string,
	display: string,
	fields: Array<GraphQLTypes["CMSField"]>,
	fieldSet: string
};
	["CMSField"]: {
	__typename: "CMSField",
	name: string,
	type: GraphQLTypes["CMSType"],
	list?: boolean | undefined,
	searchable?: boolean | undefined,
	sortable?: boolean | undefined,
	options?: Array<string> | undefined,
	relation?: string | undefined,
	fields?: Array<GraphQLTypes["CMSField"]> | undefined,
	builtIn?: boolean | undefined
};
	["ObjectId"]: "scalar" & { name: "ObjectId" };
	["S3Scalar"]: "scalar" & { name: "S3Scalar" };
	["Timestamp"]: "scalar" & { name: "Timestamp" };
	["ModelNavigationCompiled"]: "scalar" & { name: "ModelNavigationCompiled" };
	["Sort"]: Sort;
	["PageInfo"]: {
	__typename: "PageInfo",
	total: number,
	hasNext?: boolean | undefined
};
	["PageInput"]: {
		limit: number,
	start?: number | undefined
};
	["ImageFieldInput"]: {
		thumbnail?: GraphQLTypes["S3Scalar"] | undefined,
	url?: GraphQLTypes["S3Scalar"] | undefined,
	alt?: string | undefined
};
	["VideoFieldInput"]: {
		previewImage?: GraphQLTypes["S3Scalar"] | undefined,
	url?: GraphQLTypes["S3Scalar"] | undefined,
	alt?: string | undefined
};
	["DuplicateDocumentsInput"]: {
		originalRootParams: GraphQLTypes["RootParamsInput"],
	newRootParams: GraphQLTypes["RootParamsInput"],
	resultLanguage?: GraphQLTypes["Languages"] | undefined,
	modelName?: string | undefined
};
	["AnalyticsResponse"]: {
	__typename: "AnalyticsResponse",
	date?: string | undefined,
	value?: Array<GraphQLTypes["AnalyticsModelResponse"]> | undefined
};
	["AnalyticsModelResponse"]: {
	__typename: "AnalyticsModelResponse",
	modelName: string,
	calls: number,
	rootParamsKey?: string | undefined,
	tokens?: number | undefined
};
	["CreateRootCMSParam"]: {
		name: string,
	options: Array<string>,
	default?: string | undefined
};
	["CreateVersion"]: {
		name: string,
	from: GraphQLTypes["Timestamp"],
	to?: GraphQLTypes["Timestamp"] | undefined
};
	["CreateInternalLink"]: {
		keys: Array<string>,
	href: string
};
	["FileResponse"]: {
	__typename: "FileResponse",
	key: string,
	cdnURL: string,
	modifiedAt?: string | undefined
};
	["FileConnection"]: {
	__typename: "FileConnection",
	items: Array<GraphQLTypes["FileResponse"] | undefined>,
	pageInfo?: GraphQLTypes["PageInfo"] | undefined
};
	["MediaResponse"]: {
	__typename: "MediaResponse",
	key?: string | undefined,
	cdnURL?: string | undefined,
	thumbnailCdnURL?: string | undefined,
	alt?: string | undefined,
	modifiedAt?: string | undefined
};
	["MediaConnection"]: {
	__typename: "MediaConnection",
	items: Array<GraphQLTypes["MediaResponse"] | undefined>,
	pageInfo?: GraphQLTypes["PageInfo"] | undefined
};
	["MediaOrderByInput"]: {
		date?: GraphQLTypes["Sort"] | undefined
};
	["MediaParamsInput"]: {
		model?: string | undefined,
	search?: string | undefined,
	allowedExtensions?: Array<string> | undefined,
	page?: GraphQLTypes["PageInput"] | undefined,
	sort?: GraphQLTypes["MediaOrderByInput"] | undefined
};
	["UploadFileInput"]: {
		key: string,
	prefix?: string | undefined,
	alt?: string | undefined
};
	["UploadFileResponseBase"]: {
	__typename: "UploadFileResponseBase",
	key: string,
	putURL: string,
	cdnURL: string,
	alt?: string | undefined
};
	["ImageUploadResponse"]: {
	__typename: "ImageUploadResponse",
	file: GraphQLTypes["UploadFileResponseBase"],
	thumbnail: GraphQLTypes["UploadFileResponseBase"]
};
	["InputCMSField"]: {
		name: string,
	type: GraphQLTypes["CMSType"],
	list?: boolean | undefined,
	searchable?: boolean | undefined,
	sortable?: boolean | undefined,
	options?: Array<string> | undefined,
	relation?: string | undefined,
	builtIn?: boolean | undefined,
	fields?: Array<GraphQLTypes["InputCMSField"]> | undefined
};
	["ApiKey"]: {
	__typename: "ApiKey",
	name: string,
	createdAt: string,
	_id: GraphQLTypes["ObjectId"],
	value: string
};
	["Languages"]: Languages;
	["Formality"]: Formality;
	["BackupFile"]: "scalar" & { name: "BackupFile" };
	["AdminQuery"]: {
	__typename: "AdminQuery",
	analytics?: Array<GraphQLTypes["AnalyticsResponse"]> | undefined,
	translationAnalytics?: Array<GraphQLTypes["AnalyticsResponse"]> | undefined,
	backup?: boolean | undefined,
	backups?: Array<GraphQLTypes["MediaResponse"]> | undefined,
	apiKeys?: Array<GraphQLTypes["ApiKey"]> | undefined
};
	["GenerateContentInput"]: {
		document: string,
	field: string,
	description?: string | undefined,
	keywords?: Array<string> | undefined,
	language?: GraphQLTypes["Languages"] | undefined
};
	["GenerateImageModel"]: GenerateImageModel;
	["GenerateImageQuality"]: GenerateImageQuality;
	["GenerateImageSize"]: GenerateImageSize;
	["GenerateImageStyle"]: GenerateImageStyle;
	["GenerateImageInput"]: {
		model: GraphQLTypes["GenerateImageModel"],
	prompt: string,
	quality?: GraphQLTypes["GenerateImageQuality"] | undefined,
	size: GraphQLTypes["GenerateImageSize"],
	style?: GraphQLTypes["GenerateImageStyle"] | undefined
};
	["TranslateDocInput"]: {
		modelName: string,
	slug: string,
	originalRootParams: GraphQLTypes["RootParamsInput"],
	newRootParams: GraphQLTypes["RootParamsInput"],
	resultLanguages: Array<GraphQLTypes["Languages"]>,
	formality?: GraphQLTypes["Formality"] | undefined,
	context?: string | undefined
};
	["Mutation"]: {
	__typename: "Mutation",
	admin?: GraphQLTypes["AdminMutation"] | undefined
};
	/** This enum is defined externally and injected via federation */
["CMSType"]: CMSType;
	["Query"]: {
	__typename: "Query",
	navigation?: Array<GraphQLTypes["ModelNavigation"]> | undefined,
	rootParams?: Array<GraphQLTypes["RootCMSParam"]> | undefined,
	versions?: Array<GraphQLTypes["VersionField"]> | undefined,
	links?: Array<GraphQLTypes["InternalLink"]> | undefined,
	admin?: GraphQLTypes["AdminQuery"] | undefined,
	isLoggedIn?: boolean | undefined,
	logoURL?: string | undefined,
	listcategory?: Array<GraphQLTypes["category"]> | undefined,
	listPaginatedcategory?: GraphQLTypes["category__Connection"] | undefined,
	onecategoryBySlug?: GraphQLTypes["category"] | undefined,
	variantscategoryBySlug?: Array<GraphQLTypes["category"]> | undefined,
	fieldSetcategory: string,
	modelcategory: GraphQLTypes["ModelNavigationCompiled"],
	listpolicy?: Array<GraphQLTypes["policy"]> | undefined,
	listPaginatedpolicy?: GraphQLTypes["policy__Connection"] | undefined,
	onepolicyBySlug?: GraphQLTypes["policy"] | undefined,
	variantspolicyBySlug?: Array<GraphQLTypes["policy"]> | undefined,
	fieldSetpolicy: string,
	modelpolicy: GraphQLTypes["ModelNavigationCompiled"],
	mediaQuery: GraphQLTypes["MediaConnection"],
	filesQuery: GraphQLTypes["FileConnection"]
};
	["AdminMutation"]: {
	__typename: "AdminMutation",
	upsertModel?: boolean | undefined,
	removeModel?: boolean | undefined,
	upsertVersion?: boolean | undefined,
	removeVersion?: boolean | undefined,
	upsertInternalLink?: boolean | undefined,
	removeInternalLink?: boolean | undefined,
	upsertParam?: boolean | undefined,
	removeParam?: boolean | undefined,
	uploadFile?: GraphQLTypes["UploadFileResponseBase"] | undefined,
	uploadImage?: GraphQLTypes["ImageUploadResponse"] | undefined,
	removeFiles?: boolean | undefined,
	restore?: boolean | undefined,
	generateApiKey?: boolean | undefined,
	revokeApiKey?: boolean | undefined,
	translateDocument?: boolean | undefined,
	generateContent: string,
	generateImage: string,
	changeLogo?: boolean | undefined,
	removeLogo?: boolean | undefined,
	duplicateDocuments?: boolean | undefined,
	upsertcategory?: boolean | undefined,
	removecategory?: boolean | undefined,
	duplicatecategory?: boolean | undefined,
	upsertpolicy?: boolean | undefined,
	removepolicy?: boolean | undefined,
	duplicatepolicy?: boolean | undefined
};
	["category"]: {
	__typename: "category",
	_version?: GraphQLTypes["VersionField"] | undefined,
	name?: string | undefined,
	img?: GraphQLTypes["ImageField"] | undefined,
	avatar?: GraphQLTypes["ImageField"] | undefined,
	slug?: string | undefined,
	_id: string,
	createdAt?: number | undefined,
	updatedAt?: number | undefined,
	draft_version?: boolean | undefined
};
	["category__Connection"]: {
	__typename: "category__Connection",
	items?: Array<GraphQLTypes["category"]> | undefined,
	pageInfo: GraphQLTypes["PageInfo"]
};
	["policy"]: {
	__typename: "policy",
	_version?: GraphQLTypes["VersionField"] | undefined,
	title?: string | undefined,
	body?: string | undefined,
	slug?: string | undefined,
	_id: string,
	createdAt?: number | undefined,
	updatedAt?: number | undefined,
	draft_version?: boolean | undefined
};
	["policy__Connection"]: {
	__typename: "policy__Connection",
	items?: Array<GraphQLTypes["policy"]> | undefined,
	pageInfo: GraphQLTypes["PageInfo"]
};
	["Modifycategory"]: {
		_version?: GraphQLTypes["CreateVersion"] | undefined,
	name?: string | undefined,
	img?: GraphQLTypes["ImageFieldInput"] | undefined,
	avatar?: GraphQLTypes["ImageFieldInput"] | undefined,
	slug?: string | undefined,
	createdAt?: number | undefined,
	updatedAt?: number | undefined,
	draft_version?: boolean | undefined
};
	["Modifypolicy"]: {
		_version?: GraphQLTypes["CreateVersion"] | undefined,
	title?: string | undefined,
	body?: string | undefined,
	slug?: string | undefined,
	createdAt?: number | undefined,
	updatedAt?: number | undefined,
	draft_version?: boolean | undefined
};
	["RootParamsInput"]: {
		_version?: string | undefined
};
	["categorySortInput"]: {
		slug?: GraphQLTypes["Sort"] | undefined,
	createdAt?: GraphQLTypes["Sort"] | undefined,
	updatedAt?: GraphQLTypes["Sort"] | undefined
};
	["policySortInput"]: {
		slug?: GraphQLTypes["Sort"] | undefined,
	createdAt?: GraphQLTypes["Sort"] | undefined,
	updatedAt?: GraphQLTypes["Sort"] | undefined
}
    }
export const enum Sort {
	asc = "asc",
	desc = "desc"
}
export const enum Languages {
	ENUS = "ENUS",
	ENGB = "ENGB",
	CS = "CS",
	RU = "RU",
	ET = "ET",
	ES = "ES",
	ZH = "ZH",
	SK = "SK",
	SL = "SL",
	IT = "IT",
	JA = "JA",
	ID = "ID",
	SV = "SV",
	KO = "KO",
	TR = "TR",
	PTBR = "PTBR",
	PTPT = "PTPT",
	EL = "EL",
	DA = "DA",
	FR = "FR",
	BG = "BG",
	LT = "LT",
	DE = "DE",
	LV = "LV",
	NB = "NB",
	NL = "NL",
	PL = "PL",
	FI = "FI",
	UK = "UK",
	RO = "RO",
	HU = "HU"
}
export const enum Formality {
	less = "less",
	more = "more",
	default = "default",
	prefer_less = "prefer_less",
	prefer_more = "prefer_more"
}
export const enum GenerateImageModel {
	dalle3 = "dalle3",
	dalle2 = "dalle2"
}
export const enum GenerateImageQuality {
	standard = "standard",
	hd = "hd"
}
export const enum GenerateImageSize {
	_256x256 = "_256x256",
	_512x512 = "_512x512",
	_1024x1024 = "_1024x1024",
	_1792x1024 = "_1792x1024",
	_1024x1792 = "_1024x1792"
}
export const enum GenerateImageStyle {
	vivid = "vivid",
	natural = "natural"
}
/** This enum is defined externally and injected via federation */
export const enum CMSType {
	STRING = "STRING",
	TITLE = "TITLE",
	NUMBER = "NUMBER",
	BOOLEAN = "BOOLEAN",
	DATE = "DATE",
	IMAGE = "IMAGE",
	VIDEO = "VIDEO",
	CONTENT = "CONTENT",
	ERROR = "ERROR",
	IMAGE_URL = "IMAGE_URL",
	FILE = "FILE",
	RELATION = "RELATION",
	SELECT = "SELECT",
	OBJECT = "OBJECT",
	OBJECT_TABS = "OBJECT_TABS"
}

type ZEUS_VARIABLES = {
	["ObjectId"]: ValueTypes["ObjectId"];
	["S3Scalar"]: ValueTypes["S3Scalar"];
	["Timestamp"]: ValueTypes["Timestamp"];
	["ModelNavigationCompiled"]: ValueTypes["ModelNavigationCompiled"];
	["Sort"]: ValueTypes["Sort"];
	["PageInput"]: ValueTypes["PageInput"];
	["ImageFieldInput"]: ValueTypes["ImageFieldInput"];
	["VideoFieldInput"]: ValueTypes["VideoFieldInput"];
	["DuplicateDocumentsInput"]: ValueTypes["DuplicateDocumentsInput"];
	["CreateRootCMSParam"]: ValueTypes["CreateRootCMSParam"];
	["CreateVersion"]: ValueTypes["CreateVersion"];
	["CreateInternalLink"]: ValueTypes["CreateInternalLink"];
	["MediaOrderByInput"]: ValueTypes["MediaOrderByInput"];
	["MediaParamsInput"]: ValueTypes["MediaParamsInput"];
	["UploadFileInput"]: ValueTypes["UploadFileInput"];
	["InputCMSField"]: ValueTypes["InputCMSField"];
	["Languages"]: ValueTypes["Languages"];
	["Formality"]: ValueTypes["Formality"];
	["BackupFile"]: ValueTypes["BackupFile"];
	["GenerateContentInput"]: ValueTypes["GenerateContentInput"];
	["GenerateImageModel"]: ValueTypes["GenerateImageModel"];
	["GenerateImageQuality"]: ValueTypes["GenerateImageQuality"];
	["GenerateImageSize"]: ValueTypes["GenerateImageSize"];
	["GenerateImageStyle"]: ValueTypes["GenerateImageStyle"];
	["GenerateImageInput"]: ValueTypes["GenerateImageInput"];
	["TranslateDocInput"]: ValueTypes["TranslateDocInput"];
	["CMSType"]: ValueTypes["CMSType"];
	["Modifycategory"]: ValueTypes["Modifycategory"];
	["Modifypolicy"]: ValueTypes["Modifypolicy"];
	["RootParamsInput"]: ValueTypes["RootParamsInput"];
	["categorySortInput"]: ValueTypes["categorySortInput"];
	["policySortInput"]: ValueTypes["policySortInput"];
}