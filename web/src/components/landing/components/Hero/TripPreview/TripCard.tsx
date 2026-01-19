'use client';

import { cn } from '@/lib/utils';
import { Plane, Building2, Ticket, Calendar } from 'lucide-react';
import { TripCardBorder } from './TripCardBorder';
import { ItineraryMini } from './ItineraryMini';
import { getAccent, type TripScenario } from '../../../data';

// =============================================================================
// TripCard - Displays a trip scenario with event, flight, hotel details
// =============================================================================

interface TripCardProps {
  scenario: TripScenario;
}

export function TripCard({ scenario }: TripCardProps) {
  const accentColor = getAccent(scenario.accentSlug);

  const formatPriceRange = (range: [number, number]) => {
    return `$${range[0].toLocaleString()}–${range[1].toLocaleString()}`;
  };

  return (
    <TripCardBorder accentColor={accentColor}>
      <div className="p-5 space-y-4">
        {/* Event Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-white/40" />
            <span className="text-xs text-white/40 uppercase tracking-wider">
              Event
            </span>
          </div>
          <h3 className="text-lg font-semibold text-[#f5f3f0]">
            {scenario.event.name}
          </h3>
          <p className="text-sm text-[#a8a5a0]">
            {scenario.event.venue} · {scenario.event.city}
          </p>
          <p className="text-sm text-white/50">{scenario.event.date}</p>
        </div>

        {/* Divider */}
        <div className="border-t border-white/[0.06]" />

        {/* Flight & Hotel Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Flight */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Plane className="w-3.5 h-3.5 text-white/40" />
              <span className="text-xs text-white/40">Flight</span>
            </div>
            <p className="text-sm font-medium text-[#f5f3f0]">
              {scenario.flight.route}
            </p>
            <p className="text-xs text-white/50">{scenario.flight.details}</p>
            <p className="text-xs text-[#cfa872]">
              {formatPriceRange(scenario.flight.priceRange)}
            </p>
          </div>

          {/* Hotel */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-white/40" />
              <span className="text-xs text-white/40">Hotel</span>
            </div>
            <p className="text-sm font-medium text-[#f5f3f0]">
              {scenario.hotel.name}
            </p>
            <p className="text-xs text-white/50">
              {scenario.hotel.rating}★ · {scenario.event.nights}{' '}
              {scenario.event.nights === 1 ? 'night' : 'nights'}
            </p>
            <p className="text-xs text-[#cfa872]">
              {formatPriceRange(scenario.hotel.pricePerNight)}/night
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/[0.06]" />

        {/* Itinerary Preview */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-white/40" />
            <span className="text-xs text-white/40">Itinerary</span>
          </div>
          <ItineraryMini itinerary={scenario.itinerary} />
        </div>

        {/* Divider */}
        <div className="border-t border-white/[0.06]" />

        {/* Total */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#a8a5a0]">Estimated total</span>
          <span className="text-lg font-semibold text-[#f5f3f0]">
            {formatPriceRange(scenario.totalRange)}
          </span>
        </div>
      </div>
    </TripCardBorder>
  );
}
