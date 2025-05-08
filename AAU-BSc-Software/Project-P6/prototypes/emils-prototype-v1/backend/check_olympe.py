import sys
import os
import traceback

try:
    import olympe
    from olympe.video.pdraw import Pdraw, PdrawState
    
    print("="*50)
    print(f"Olympe version: {olympe.__version__}")
    print(f"Olympe path: {olympe.__file__}")
    
    print("\nChecking Pdraw...")
    try:
        pdraw_obj = Pdraw()
        pdraw_info = {"Pdraw": "Successfully initialized"}
        print("  Pdraw initialized successfully")
    except Exception as e:
        pdraw_info = {"Pdraw error": str(e)}
        print(f"  Pdraw error: {e}")
        
    print("\nOlympe module information:")
    for attr in dir(olympe):
        if not attr.startswith("_"):
            try:
                value = getattr(olympe, attr)
                if not callable(value):
                    print(f"  {attr}: {value}")
            except:
                print(f"  {attr}: <error getting value>")
    
    print("\nLooking for known modules:")
    for module_name in ["arsdkng", "media", "messages", "video", "enums"]:
        try:
            if hasattr(olympe, module_name):
                print(f"  ✓ {module_name} found")
            else:
                print(f"  ✗ {module_name} NOT found")
        except Exception as e:
            print(f"  ✗ Error checking {module_name}: {e}")
            
    print("="*50)
    
except ImportError as e:
    print(f"ERROR: Could not import olympe: {e}")
    print("Please make sure olympe is properly installed")
    
except Exception as e:
    print(f"ERROR: Unexpected error when checking olympe: {e}")
    traceback.print_exc()

print("\nChecking PYTHONPATH:")
print(sys.path)
