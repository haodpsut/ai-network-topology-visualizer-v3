
import React, { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
import { CytoscapeData, DeviceType } from '../types';
import { ROUTER_ICON, SWITCH_ICON, PC_ICON, SERVER_ICON, FIREWALL_ICON, CLOUD_ICON } from '../constants';

interface TopologyDiagramProps {
  data: CytoscapeData;
}

const iconMap: Record<DeviceType, string> = {
  router: ROUTER_ICON,
  switch: SWITCH_ICON,
  pc: PC_ICON,
  server: SERVER_ICON,
  firewall: FIREWALL_ICON,
  cloud: CLOUD_ICON,
  subnet: '', // Subnets don't have icons
};

const abbreviateIp = (ipWithCidr?: string): string => {
  if (!ipWithCidr) return '';
  const ip = ipWithCidr.split('/')[0];
  const octets = ip.split('.');
  return octets.length === 4 ? `.${octets[3]}` : '';
};


const TopologyDiagram: React.FC<TopologyDiagramProps> = ({ data }) => {
  const cyRef = useRef<HTMLDivElement>(null);
  const cyInstance = useRef<cytoscape.Core | null>(null);

  useEffect(() => {
    if (cyRef.current && data.nodes.length > 0) {
        if (cyInstance.current) {
            cyInstance.current.destroy();
        }

      const elements = [
        ...data.nodes.map(node => {
          const newLabel = (node.data.type === 'pc' || node.data.type === 'server') && node.data.ip
            ? `${node.data.label}\n${abbreviateIp(node.data.ip)}`
            : node.data.label;
          return {
            group: 'nodes' as const,
            data: {
              ...node.data,
              label: newLabel,
            },
          };
        }),
        ...data.edges.map(edge => ({
          group: 'edges' as const,
          data: {
            ...edge.data,
            sourceLabel: `${edge.data.sourceLabel}${edge.data.sourceIp ? ` (${abbreviateIp(edge.data.sourceIp)})` : ''}`,
            targetLabel: `${edge.data.targetLabel}${edge.data.targetIp ? ` (${abbreviateIp(edge.data.targetIp)})` : ''}`,
          }
        })),
      ];

      cyInstance.current = cytoscape({
        container: cyRef.current,
        elements: elements,
        style: [
          {
            selector: 'node',
            style: {
              'width': 60,
              'height': 60,
              'background-color': '#1f2937',
              'background-fit': 'contain',
              'background-clip': 'none',
              'label': 'data(label)',
              'text-valign': 'bottom',
              'text-halign': 'center',
              'color': '#cbd5e1',
              'font-size': '12px',
              'text-wrap': 'wrap',
              'text-margin-y': 5,
            },
          },
          {
            selector: 'node[type="subnet"]',
            style: {
              'shape': 'rectangle',
              'background-color': '#2d3748',
              'background-opacity': 0.3,
              'border-width': 2,
              'border-style': 'dashed',
              'border-color': '#4a5568',
              'text-valign': 'top',
              'text-halign': 'center',
              'color': '#38bdf8',
              'font-size': '16px',
              'font-weight': 'bold',
              'padding': '20px',
              'text-margin-y': 10,
            }
          },
          ...Object.entries(iconMap).filter(([,iconUrl]) => iconUrl).map(([type, iconUrl]) => ({
              selector: `node[type='${type}']`,
              style: {
                  'background-image': iconUrl
              }
          })),
          {
            selector: 'edge',
            style: {
              'width': 2,
              'line-color': '#4b5563',
              'target-arrow-shape': 'none',
              'curve-style': 'bezier',
              'source-label': 'data(sourceLabel)',
              'target-label': 'data(targetLabel)',
              'font-size': '11px',
              'color': '#9ca3af',
              'text-rotation': 'autorotate',
              'source-text-offset': 25,
              'target-text-offset': 25,
              'text-background-color': '#111827',
              'text-background-opacity': 1,
              'text-background-padding': '2px',
            },
          },
          {
            selector: 'edge[label]',
            style: {
              'label': 'data(label)',
              'font-size': '14px',
              'font-weight': 'bold',
              'color': '#38bdf8',
              'text-background-padding': '3px',
            }
          }
        ],
        layout: {
          name: 'cose',
          idealEdgeLength: 200,
          nodeOverlap: 40,
          refresh: 20,
          fit: true,
          padding: 40,
          randomize: false,
          componentSpacing: 150,
          nodeRepulsion: 800000,
          edgeElasticity: 200,
          nestingFactor: 5,
          gravity: 80,
          numIter: 1000,
          initialTemp: 200,
          coolingFactor: 0.95,
          minTemp: 1.0,
        },
      });

      return () => {
        if (cyInstance.current) {
          cyInstance.current.destroy();
          cyInstance.current = null;
        }
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return <div ref={cyRef} className="w-full h-full bg-gray-900/70 rounded-lg border border-gray-700" />;
};

export default TopologyDiagram;