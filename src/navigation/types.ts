import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { SummaryParams } from '../types';

export type RootStackParamList = {
  Home: undefined;
  Summary: SummaryParams;
};

export type HomeNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;
export type SummaryRouteProp = RouteProp<RootStackParamList, 'Summary'>;
export type SummaryNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Summary'>;
