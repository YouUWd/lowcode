<template>
  <div class="flex flex-col h-full bg-white rounded-xl shadow-inner border border-outline-variant/10 overflow-hidden">
    <div class="bg-surface-container-low px-6 py-3 border-b border-outline-variant/15 flex justify-between items-center">
      <div class="flex items-center gap-4">
        <h3 class="text-sm font-bold text-on-surface flex items-center">
          <span class="material-symbols-outlined mr-2 text-primary">edit_note</span>
          BPMN 可视化流程建模器
        </h3>
        <div class="flex bg-white rounded-lg p-1 border border-outline-variant/20">
          <button @click="saveDiagram" class="px-3 py-1 text-xs font-bold bg-primary text-on-primary rounded-md hover:bg-primary/90 transition-all flex items-center gap-1">
            <span class="material-symbols-outlined text-[14px]">save</span> 保存并发布
          </button>
        </div>
      </div>
      <div class="text-[10px] font-mono text-on-surface-variant opacity-50 uppercase tracking-tighter">
        Lumina Workflow Engine v2.0 Modeling Tool
      </div>
    </div>
    
    <div ref="container" class="flex-1 canvas-container relative"></div>
  </div>
</template>

<script setup>
import { onMounted, ref, onBeforeUnmount } from 'vue';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-codes.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';

const container = ref(null);
let bpmnModeler = null;

// 默认空白 BPMN 模板
const initialDiagram = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" name="开始" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="173" y="102" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

onMounted(async () => {
  bpmnModeler = new BpmnModeler({
    container: container.value,
    keyboard: {
      bindTo: window
    }
  });

  try {
    await bpmnModeler.importXML(initialDiagram);
    const canvas = bpmnModeler.get('canvas');
    canvas.zoom('fit-viewport');
  } catch (err) {
    console.error('BPMN 建模器初始化失败:', err);
  }
});

const saveDiagram = async () => {
  try {
    const { xml } = await bpmnModeler.saveXML({ format: true });
    console.log('[Workflow Designer] 保存 XML:', xml);
    alert('BPMN XML 已生成至控制台。在正式版中，此处将调用后端解析器将 XML 转化为 sys_approval_chain_config 记录。');
  } catch (err) {
    console.error('保存流程图失败:', err);
  }
};

onBeforeUnmount(() => {
  if (bpmnModeler) {
    bpmnModeler.destroy();
  }
});
</script>

<style>
.canvas-container {
  height: 100%;
}
.bjs-powered-by {
  display: none;
}
/* Override bpmn-js styles for Lumina Look & Feel */
.djs-palette {
  background: white !important;
  border-radius: 12px !important;
  border: 1px solid rgba(0, 93, 170, 0.1) !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05) !important;
  left: 20px !important;
  top: 20px !important;
}
</style>
