import os

def combine_html_files(search_dir):
    excluded_files = {}
    combined_content = []

    for file_name in os.listdir(search_dir):
        if file_name.endswith('.html') and file_name not in excluded_files:
            with open(os.path.join(search_dir, file_name), 'r') as file:
                content = file.read()
                combined_content.append(f"<!-- {file_name} -->\n{content}\n")

    with open(os.path.join(search_dir, 'combined.html'), 'w') as combined_file:
        combined_file.write('\n'.join(combined_content))

if __name__ == "__main__":
    search_dir = './themes/stack/layouts/partials/resume'
    combine_html_files(search_dir)
