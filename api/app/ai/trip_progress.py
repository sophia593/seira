"""
Trip Progress Tracker

Tracks what's been completed in a trip planning conversation
and determines what's needed next.
"""

from __future__ import annotations
from typing import Any
from pydantic import BaseModel


class TripProgress(BaseModel):
    """Tracks the state of a trip being planned."""

    # What we have
    event_selected: bool = False
    event_details: dict[str, Any] | None = None  # name, date, venue, city

    origin_known: bool = False
    origin_city: str | None = None
    is_local: bool = False  # User is local, doesn't need flights

    flights_selected: bool = False
    outbound_flight: dict[str, Any] | None = None
    return_flight: dict[str, Any] | None = None

    hotels_researched: bool = False
    hotel_notes: str | None = None

    # What the user has declined or skipped
    flights_skipped: bool = False  # User said they don't need flights
    hotels_skipped: bool = False   # User said they don't need hotels

    def needs_flights(self) -> bool:
        """Does this trip need flights?"""
        if self.is_local or self.flights_skipped:
            return False
        return not self.flights_selected

    def is_complete(self) -> bool:
        """Is this trip complete enough to save?"""
        # Minimum: must have an event
        if not self.event_selected:
            return False

        # If not local and hasn't skipped flights, need flights
        if not self.is_local and not self.flights_skipped and not self.flights_selected:
            return False

        return True

    def what_we_have(self) -> list[str]:
        """List what's been completed."""
        have = []
        if self.event_selected:
            have.append(f"Event: {self.event_details.get('name', 'Selected')}")
        if self.flights_selected:
            have.append(f"Flights from {self.origin_city}")
        elif self.is_local:
            have.append("Local (no flights needed)")
        if self.hotels_researched:
            have.append("Hotel suggestions saved")
        return have

    def what_we_need(self) -> list[str]:
        """List what's still needed."""
        need = []
        if not self.event_selected:
            need.append("Pick an event")
        elif not self.origin_known and not self.is_local:
            need.append("Where you're traveling from")
        elif self.needs_flights():
            need.append("Flights")
        return need

    def next_step(self) -> str:
        """Describe the logical next action."""
        if not self.event_selected:
            return "help user find and select an event"

        if not self.origin_known and not self.is_local:
            return "ask where user is traveling from, or if they're local"

        if self.needs_flights():
            return "search for flights"

        if self.is_complete() and not self.hotels_researched and not self.hotels_skipped:
            return "offer to look up hotels or save the trip"

        if self.is_complete():
            return "offer to save the trip"

        return "continue helping user"

    def summary_for_user(self) -> str:
        """Human-friendly progress summary."""
        have = self.what_we_have()
        need = self.what_we_need()

        if not have:
            return "Let's start planning your trip."

        if not need:
            return f"We've got everything: {', '.join(have)}. Ready to save?"

        return f"So far: {', '.join(have)}. Still need: {', '.join(need)}."


def extract_progress_from_context(context: dict[str, Any] | None) -> TripProgress:
    """Build TripProgress from conversation context."""
    if not context:
        return TripProgress()

    return TripProgress(
        event_selected=context.get("event_selected", False),
        event_details=context.get("event_details"),
        origin_known=context.get("origin_known", False),
        origin_city=context.get("origin_city"),
        is_local=context.get("is_local", False),
        flights_selected=context.get("flights_selected", False),
        outbound_flight=context.get("outbound_flight"),
        return_flight=context.get("return_flight"),
        flights_skipped=context.get("flights_skipped", False),
        hotels_researched=context.get("hotels_researched", False),
        hotel_notes=context.get("hotel_notes"),
        hotels_skipped=context.get("hotels_skipped", False),
    )
