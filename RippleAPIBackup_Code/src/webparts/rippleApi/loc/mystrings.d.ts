declare interface IRippleApiWebPartStrings {
  PropertyPaneDescription: string;
  BasicGroupName: string;
  DescriptionFieldLabel: string;
  ServerName:string;
  FromAddress:string;
  FromSecret:string;
}

declare module 'RippleApiWebPartStrings' {
  const strings: IRippleApiWebPartStrings;
  export = strings;
}
