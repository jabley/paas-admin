interface IRangeable {
  readonly rangeStart: string;
  readonly rangeStop: string;
}

interface IEventFilter extends IRangeable {
  readonly orgGUIDs: ReadonlyArray<string>;
}

interface IForecastParameters extends IEventFilter {
  readonly events: ReadonlyArray<IUsageEvent>;
}

interface IPricingPlanResponse {
  readonly name: string;
  readonly plan_guid: string;
  readonly valid_from: string;
  readonly components: ReadonlyArray<IComponentResponse>;
  readonly number_of_nodes: number;
  readonly memory_in_mb: number;
  readonly storage_in_mb: number;
}

interface IPricingPlan {
  readonly name: string;
  readonly planGUID: string;
  readonly validFrom: Date;
  readonly components: ReadonlyArray<IComponent>;
  readonly numberOfNodes: number;
  readonly memoryInMB: number;
  readonly storageInMB: number;
}

interface IComponentResponse {
  readonly name: string;
  readonly formula: string;
  readonly vat_code: string;
  readonly currency_code: string;
}

interface IComponent {
  readonly name: string;
  readonly formula: string;
  readonly vatCode: string;
  readonly currencyCode: string;
}

interface IPriceComponent {
  readonly name: string;
  readonly planName: string;
  readonly start: Date;
  readonly stop: Date;
  readonly VATCode: string;
  readonly VATRate: number;
  readonly currencyCode: string;
  readonly currencyRate: number;
  readonly incVAT: number;
  readonly exVAT: number;
}

interface IPrice {
  readonly incVAT: number;
  readonly exVAT: number;
  readonly details: ReadonlyArray<IPriceComponent>;
}

interface IUsageEvent {
  readonly eventGUID: string;
  readonly eventStart: Date;
  readonly eventStop: Date;
  readonly resourceGUID: string;
  readonly resourceName: string;
  readonly resourceType: string;
  readonly orgGUID: string;
  readonly spaceGUID: string;
  readonly planGUID: string;
  readonly numberOfNodes: number;
  readonly memoryInMB: number;
  readonly storageInMB: number;
}

interface IBillableEvent extends IUsageEvent {
  readonly price: IPrice;
}

interface IUsageEventResponse {
  readonly event_guid: string;
  readonly event_start: string;
  readonly event_stop: string;
  readonly resource_guid: string;
  readonly resource_name: string;
  readonly resource_type: string;
  readonly org_guid: string;
  readonly space_guid: string;
  readonly plan_guid: string;
  readonly number_of_nodes: number;
  readonly memory_in_mb: number;
  readonly storage_in_mb: number;
}

interface IBillableEventResponse extends IUsageEventResponse {
  price: {
    readonly inc_vat: string;
    readonly ex_vat: string;
    readonly details: ReadonlyArray<IPriceComponentResponse>;
  };
}

interface IPriceComponentResponse {
  readonly name: string;
  readonly plan_name: string;
  readonly start: string;
  readonly stop: string;
  readonly vat_code: string;
  readonly vat_rate: string;
  readonly currency_code: string;
  readonly currency_rate: string;
  readonly inc_vat: string;
  readonly ex_vat: string;
}

interface IBillingClientConfig {
  readonly apiEndpoint: string;
  readonly accessToken: string;
}
