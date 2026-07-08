import os
import subprocess
import sys

def main():
    dest_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../utils/model_onnx"))
    os.makedirs(dest_dir, exist_ok=True)

    if os.path.exists(os.path.join(dest_dir, "model.onnx")) and os.path.exists(os.path.join(dest_dir, "config.json")):
        print("ONNX model already exists, skipping download/export.")
        return

    print("Installing optimum[onnxruntime] for ONNX export...")
    subprocess.run([sys.executable, "-m", "pip", "install", "optimum[onnxruntime]", "transformers"], check=True)

    print("Exporting mrsinghania/asr-question-detection to ONNX...")
    cmd = [
        sys.executable, "-m", "optimum.exporters.onnx",
        "--model", "mrsinghania/asr-question-detection",
        "--task", "text-classification",
        dest_dir
    ]
    subprocess.run(cmd, check=True)

    # Save configuration files
    from transformers import AutoConfig
    print("Saving configuration...")
    config = AutoConfig.from_pretrained("mrsinghania/asr-question-detection")
    config.save_pretrained(dest_dir)
    print("Model download and export complete.")

if __name__ == "__main__":
    main()
