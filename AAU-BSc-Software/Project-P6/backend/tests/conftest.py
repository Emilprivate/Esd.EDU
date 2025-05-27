import pytest
import sys
import os
from unittest.mock import MagicMock, patch

# Add the project root to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

@pytest.fixture
def sample_fixture():
    return "sample data"

@pytest.fixture
def mock_event():
    """Create a mock event object"""
    event = MagicMock()
    event.args = {}
    return event

@pytest.fixture
def mock_scheduler():
    """Create a mock scheduler"""
    return MagicMock()

@pytest.fixture
def sample_coordinates():
    """Sample coordinates for a square in Aalborg"""
    return [
        (57.0128, 9.9905),  # Southwest corner
        (57.0128, 9.9925),  # Southeast corner
        (57.0148, 9.9925),  # Northeast corner
        (57.0148, 9.9905)   # Northwest corner
    ]