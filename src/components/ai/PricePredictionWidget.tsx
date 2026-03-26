'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  Sparkles,
  Loader2,
  ArrowRight,
  Info,
  Target,
  Zap,
  CalendarClock
} from 'lucide-react';

interface PricePrediction {
  currentPrice: number;
  predictedBestPrice: number;
  predictedSavings: number;
  recommendation: 'book_now' | 'wait' | 'flexible';
  confidence: number;
  reasons: string[];
  priceHistory: { date: string; price: number; event?: string }[];
  upcomingEvents: { date: string; event: string; priceImpact: string }[];
  bestBookingWindow: string;
  aiInsight: string;
}

interface PricePredictionWidgetProps {
  hotelId: string;
  hotelName: string;
  city: string;
  currentPrice: number;
  discountPercent: number;
  starRating: number;
  category: string;
  checkInDate?: string;
  lengthOfStay?: number;
  onPredictionLoaded?: (prediction: PricePrediction) => void;
}

export default function PricePredictionWidget({
  hotelId,
  hotelName,
  city,
  currentPrice,
  discountPercent,
  starRating,
  category,
  checkInDate,
  lengthOfStay = 1,
  onPredictionLoaded
}: PricePredictionWidgetProps) {
  const [prediction, setPrediction] = useState<PricePrediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const fetchPrediction = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/price-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelId,
          hotelName,
          city,
          currentPrice,
          discountPercent,
          starRating,
          category,
          checkInDate,
          lengthOfStay
        })
      });

      const data = await response.json();

      if (data.success) {
        setPrediction(data.prediction);
        if (onPredictionLoaded) {
          onPredictionLoaded(data.prediction);
        }
      } else {
        throw new Error(data.error || 'Failed to get prediction');
      }
    } catch (err) {
      console.error('Prediction error:', err);
      setError('Unable to generate prediction. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hotelId && currentPrice) {
      fetchPrediction();
    }
  }, [hotelId, currentPrice]);

  const getRecommendationConfig = (rec: string) => {
    switch (rec) {
      case 'book_now':
        return {
          icon: <Zap className="w-5 h-5" />,
          label: 'Book Now',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          gradient: 'from-green-500 to-emerald-500'
        };
      case 'wait':
        return {
          icon: <Clock className="w-5 h-5" />,
          label: 'Wait for Better Price',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          gradient: 'from-orange-500 to-amber-500'
        };
      default:
        return {
          icon: <Minus className="w-5 h-5" />,
          label: 'Flexible',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          gradient: 'from-blue-500 to-indigo-500'
        };
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getPriceChangeIndicator = () => {
    if (!prediction) return null;
    
    const diff = prediction.predictedBestPrice - currentPrice;
    const percentChange = ((diff / currentPrice) * 100).toFixed(1);
    
    if (diff < -5) {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <TrendingDown className="w-4 h-4" />
          <span className="text-sm font-medium">{percentChange}% lower expected</span>
        </div>
      );
    } else if (diff > 5) {
      return (
        <div className="flex items-center gap-1 text-red-600">
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm font-medium">{percentChange}% higher expected</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 text-gray-600">
        <Minus className="w-4 h-4" />
        <span className="text-sm font-medium">Price expected to remain stable</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
            <span className="text-gray-600">Analyzing price trends...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-100 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
          <Button variant="outline" size="sm" className="mt-2" onClick={fetchPrediction}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!prediction) return null;

  const config = getRecommendationConfig(prediction.recommendation);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">AI Price Prediction</CardTitle>
              <CardDescription className="text-xs">Powered by smart analytics</CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            <Sparkles className="w-3 h-3 mr-1" />
            AI
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main Recommendation */}
        <div className={`p-4 rounded-xl ${config.bgColor} border ${config.borderColor}`}>
          <div className="flex items-center justify-between mb-3">
            <div className={`flex items-center gap-2 ${config.color}`}>
              {config.icon}
              <span className="font-bold text-lg">{config.label}</span>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Confidence</p>
              <p className="font-bold text-lg">{prediction.confidence}%</p>
            </div>
          </div>
          
          <Progress 
            value={prediction.confidence} 
            className="h-2 mb-3"
          />
          
          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="text-gray-500">Current Price</p>
              <p className="font-bold text-xl">${currentPrice}<span className="text-sm font-normal text-gray-500">/night</span></p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <div className="text-right">
              <p className="text-gray-500">Predicted Best</p>
              <p className="font-bold text-xl text-green-600">${prediction.predictedBestPrice}<span className="text-sm font-normal text-gray-500">/night</span></p>
            </div>
          </div>
        </div>

        {/* Savings Badge */}
        {prediction.predictedSavings > 0 && (
          <div className="flex items-center justify-center gap-2 py-2 px-4 bg-green-50 rounded-lg border border-green-100">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700">
              Potential savings of <strong>${prediction.predictedSavings}</strong> per night
            </span>
          </div>
        )}

        {/* Price Trend */}
        {getPriceChangeIndicator()}

        {/* Best Booking Window */}
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <CalendarClock className="w-4 h-4 text-purple-500" />
          <span className="text-sm text-gray-700">{prediction.bestBookingWindow}</span>
        </div>

        {/* AI Insight */}
        <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-purple-800">{prediction.aiInsight}</p>
          </div>
        </div>

        {/* Key Reasons */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Info className="w-4 h-4" />
            Key Factors
          </h4>
          <ul className="space-y-1.5">
            {prediction.reasons.map((reason, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                {reason}
              </li>
            ))}
          </ul>
        </div>

        {/* Show More Toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? 'Hide Details' : 'View Price History & Events'}
        </Button>

        {/* Expanded Details */}
        {showDetails && (
          <div className="space-y-4 pt-2">
            <Separator />
            
            {/* Price History Chart (Simplified) */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">30-Day Price History</h4>
              <div className="h-24 flex items-end gap-0.5 bg-gray-50 rounded-lg p-2">
                {prediction.priceHistory.slice(-14).map((point, idx) => {
                  const maxPrice = Math.max(...prediction.priceHistory.map(p => p.price));
                  const minPrice = Math.min(...prediction.priceHistory.map(p => p.price));
                  const range = maxPrice - minPrice || 1;
                  const height = ((point.price - minPrice) / range) * 100;
                  
                  return (
                    <div
                      key={idx}
                      className="flex-1 bg-gradient-to-t from-purple-400 to-pink-400 rounded-t opacity-80 hover:opacity-100 transition-opacity relative group"
                      style={{ height: `${Math.max(height, 10)}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        ${point.price}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Upcoming Events */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Upcoming Events</h4>
              <div className="space-y-2">
                {prediction.upcomingEvents.map((event, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{formatDate(event.date)}</span>
                      <span className="text-gray-600">{event.event}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {event.priceImpact}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
