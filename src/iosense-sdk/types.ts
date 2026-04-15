export type ConditionOperator = '>' | '<' | '>=' | '<=' | '==';

export interface ImageCondition {
  id: string;
  dataPointIndex: number;  // which index in the data array to evaluate this condition on
  operator: ConditionOperator;
  value: string;       // stored as string (TextInput); parsed to number on evaluation
  imageUrl: string;    // base64 data URL of the image
  imageName: string;   // original file name for display
}

export interface ImageWidgetSource {
  customValue: string;
}

export interface ImageWidgetLink {
  url: string;
}

export interface ImageWidgetStyle {
  wrapInCard: boolean;
  backgroundColor: string;
  borderColor: string;
  borderWidth: string;
  borderRadius: string;
  padding: string;
}

export interface ImageWidgetConfig {
  source: ImageWidgetSource;
  conditions: ImageCondition[];
  defaultImageUrl: string;
  defaultImageName: string;
  link: ImageWidgetLink;
  style: ImageWidgetStyle;
}

// The data format passed by the platform resolver via the `data` prop
export type ImageWidgetData = Array<{ data: number }>;
