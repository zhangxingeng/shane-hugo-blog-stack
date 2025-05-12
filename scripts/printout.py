import os
import pathlib

# Get the directory where this script is located
current_dir = pathlib.Path(__file__).parent.absolute()
output_file = current_dir / "combined.scss"

# Function to recursively find all scss files
def find_scss_files(directory):
    scss_files = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(".scss"):
                scss_files.append(os.path.join(root, file))
    return scss_files

# Find all scss files
scss_files = find_scss_files(current_dir)

# Create the combined file
with open(output_file, "w", encoding="utf-8") as combined:
    for scss_file in scss_files:
        # Get the relative path from the current directory
        relative_path = os.path.relpath(scss_file, current_dir)
        
        # Add a comment with the file path
        combined.write(f"/* File: {relative_path} */\n\n")
        
        # Read and write the content of the file
        try:
            with open(scss_file, "r", encoding="utf-8") as file:
                content = file.read()
                combined.write(content)
                
                # Add a newline between files for better readability
                combined.write("\n\n")
                
            print(f"Added: {relative_path}")
        except Exception as e:
            print(f"Error reading {relative_path}: {e}")

print(f"Combined SCSS file created at: {output_file}")
print(f"Total files combined: {len(scss_files)}")
