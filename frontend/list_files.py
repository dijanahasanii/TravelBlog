import os

frontend_path = "."

file_names = []
for root, dirs, files in os.walk(frontend_path):
    for file in files:
        file_names.append(file)

# Shfaq fajllat e renditur
for name in sorted(file_names):
    print(name)
