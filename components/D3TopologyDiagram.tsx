
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { CytoscapeData, DeviceType } from '../types';
import { ROUTER_ICON, SWITCH_ICON, PC_ICON, SERVER_ICON, FIREWALL_ICON, CLOUD_ICON } from '../constants';

interface D3TopologyDiagramProps {
  data: CytoscapeData;
}

const iconMap: Record<DeviceType, string> = {
  router: ROUTER_ICON,
  switch: SWITCH_ICON,
  pc: PC_ICON,
  server: SERVER_ICON,
  firewall: FIREWALL_ICON,
  cloud: CLOUD_ICON,
  subnet: '', // Subnets are drawn as shapes, not icons
};

const abbreviateIp = (ipWithCidr?: string): string => {
  if (!ipWithCidr) return '';
  const ip = ipWithCidr.split('/')[0];
  const octets = ip.split('.');
  return octets.length === 4 ? `.${octets[3]}` : '';
};

const D3TopologyDiagram: React.FC<D3TopologyDiagramProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data) return;

    const svg = d3.select(svgRef.current);
    const parentElement = svg.node()?.parentElement;
    if (!parentElement) return;

    svg.selectAll("*").remove(); // Clear previous render

    const { width, height } = parentElement.getBoundingClientRect();
    svg.attr('width', width).attr('height', height);

    const container = svg.append("g");
    
    const zoom = d3.zoom<SVGSVGElement, unknown>().on("zoom", (event) => {
      container.attr("transform", event.transform);
    });
    svg.call(zoom);

    const deviceNodes = data.nodes.filter(n => n.data.type !== 'subnet').map(n => ({ ...n.data }));
    const subnetNodes = data.nodes.filter(n => n.data.type === 'subnet').map(n => ({ ...n.data }));
    const links = data.edges.map(e => ({ ...e.data }));

    const simulation = d3.forceSimulation(deviceNodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(150).strength(0.5))
      .force("charge", d3.forceManyBody().strength(-600))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(50));

    const subnetGroup = container.append("g").attr("class", "subnets").selectAll("g")
      .data(subnetNodes).join("g");

    subnetGroup.append("rect");
    subnetGroup.append("text")
      .attr("fill", "#38bdf8")
      .attr("font-size", "16px")
      .attr("font-weight", "bold")
      .attr("text-anchor", "middle")
      .text(d => d.label);
      
    const linkGroup = container.append("g").attr("class", "links").selectAll("g")
        .data(links).join("g");

    linkGroup.append("line").attr("stroke", "#4b5563").attr("stroke-width", 2);
    
    // Interface and network labels
    const addLabel = (selector: string, textFn: (d: any) => string, color: string, size: string, weight: string = 'normal') => {
        linkGroup.append("text")
            .attr("class", selector)
            .text(textFn)
            .attr("fill", color)
            .attr("font-size", size)
            .attr("font-weight", weight)
            .attr("text-anchor", "middle");
    };

    addLabel("network-label", (d: any) => d.label || "", "#38bdf8", "14px", "bold");
    addLabel("source-label", d => `${d.sourceLabel}${d.sourceIp ? ` (${abbreviateIp(d.sourceIp)})` : ''}`, "#9ca3af", "11px");
    addLabel("target-label", d => `${d.targetLabel}${d.targetIp ? ` (${abbreviateIp(d.targetIp)})` : ''}`, "#9ca3af", "11px");


    const node = container.append("g").attr("class", "nodes").selectAll("g")
      .data(deviceNodes).join("g").call(drag(simulation) as any);

    node.append("image")
      .attr("href", (d: any) => iconMap[d.type as DeviceType] || '')
      .attr("width", 50).attr("height", 50)
      .attr("x", -25).attr("y", -25);

    node.append("text")
      .attr("y", 40).attr("text-anchor", "middle").attr("fill", "#cbd5e1").style("font-size", "12px")
      .each(function(d: any) {
        const text = d3.select(this);
        const label = d.label;
        const ipLabel = (d.type === 'pc' || d.type === 'server') && d.ip ? abbreviateIp(d.ip) : null;
        text.append("tspan").text(label);
        if (ipLabel) {
            text.append("tspan").attr("x", 0).attr("dy", "1.2em").text(ipLabel);
        }
      });

    simulation.on("tick", () => {
      linkGroup.each(function(d: any) {
        const el = d3.select(this);
        el.select('line').attr("x1", d.source.x).attr("y1", d.source.y).attr("x2", d.target.x).attr("y2", d.target.y);
        
        const midX = (d.source.x + d.target.x) / 2;
        const midY = (d.source.y + d.target.y) / 2;
        const angle = Math.atan2(d.target.y - d.source.y, d.target.x - d.source.x) * 180 / Math.PI;
        const finalAngle = angle > 90 || angle < -90 ? angle + 180 : angle;
        const transform = `translate(${midX}, ${midY}) rotate(${finalAngle})`;

        el.select(".network-label").attr("transform", transform).attr("dy", "0.35em");
        el.select(".source-label").attr("transform", transform).attr("dy", "-0.8em");
        el.select(".target-label").attr("transform", transform).attr("dy", "1.5em");
      });

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
      
      subnetGroup.each(function(subnet: any) {
        const childNodes = deviceNodes.filter(n => n.parent === subnet.id);
        const groupEl = d3.select(this);
        if (childNodes.length > 0) {
          const xs = childNodes.map((n: any) => n.x);
          const ys = childNodes.map((n: any) => n.y);
          const padding = 40;
          const minX = d3.min(xs) - padding;
          const minY = d3.min(ys) - padding;
          const maxX = d3.max(xs) + padding;
          const maxY = d3.max(ys) + padding;
          
          const rectWidth = maxX - minX;
          const rectHeight = maxY - minY;

          groupEl.select('rect')
            .attr('x', minX).attr('y', minY)
            .attr('width', rectWidth).attr('height', rectHeight)
            .attr("fill", "#2d3748").attr("fill-opacity", 0.3)
            .attr("stroke", "#4a5568").attr("stroke-width", 2).attr("stroke-dasharray", "5,5")
            .attr("rx", 10).attr("ry", 10);
          
          groupEl.select('text')
            .attr('x', minX + rectWidth / 2) // Center horizontally
            .attr('y', minY + 20); // Position near top
        } else {
            groupEl.select('rect').attr('width', 0).attr('height', 0);
        }
      });
    });

    function drag(simulation: any) {
      function dragstarted(event: any, d: any) { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; }
      function dragged(event: any, d: any) { d.fx = event.x; d.fy = event.y; }
      function dragended(event: any, d: any) { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }
      return d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended);
    }
    
    const resizeObserver = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      svg.attr('width', width).attr('height', height);
      simulation.force("center", d3.forceCenter(width / 2, height / 2));
      simulation.alpha(0.3).restart();
    });
    resizeObserver.observe(parentElement);

    return () => {
      simulation.stop();
      resizeObserver.unobserve(parentElement);
    };

  }, [data]);

  return (
    <div className="w-full h-full">
        <svg ref={svgRef} className="rounded-lg bg-gray-900/70 border border-gray-700"></svg>
    </div>
  );
};

export default D3TopologyDiagram;