/*
 * Copyright (c) 2017 CCS/GMRV/UPM/URJC.
 *
 * Authors: Juan P. Brito <juanpedro.brito@upm.es>
 * 			Nicusor Cosmin Toader <cosmin.toader@urjc.es>
 *
 * This library is free software; you can redistribute it and/or modify it under
 * the terms of the GNU Lesser General Public License version 3.0 as published
 * by the Free Software Foundation.
 *
 * This library is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this library; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 *
 */

MSP.SimulationFilter = function () {
  this.gNeuronsFilter = [];
  this.gNeuronsFilterB = [];
  this.gNeuronsRep = [];
  this.gConnectivity = [];
  this.excitatory = true;
  this.inhibitory = true;
  this.filters = [];
  this.order = "none";
  this.orderIndex = [];
  this.inverseOrder = false;
  this.orderMix = true;
  this.excitatoryNum = 0;
  this.inhibitoryNum = 0;
};

MSP.SimulationFilter.prototype = {
  constructor: MSP.SimulationFilter,

  init: function () {
    var self = this;
    _SimulationData.gNeurons.forEach(function (d) {
      if (d.NAct === "E")
        self.excitatoryNum += 1;
      else
        self.inhibitoryNum += 1;
    });
  },

  filter: function () {
    var self = this;
    if (this.filters.length > 0) {
      this.gNeuronsFilterB = [];
      var size = _SimulationData.gNeurons.length;
      while (size--) this.gNeuronsFilterB[size] = true;
      var self = this;
      this.gNeuronsFilter = [];
      _SimulationData.gNeurons.forEach(
        function (d, z) {
          for (var i = 0; i < self.filters.length; i++) {
            //Calcium filter
            if (self.filters[i].type === "Ca" &&
                !(_SimulationData.gNeuronsDetails[d.NId].Calcium[_SimulationController.actSimStep] >= self.filters[i].min &&
                _SimulationData.gNeuronsDetails[d.NId].Calcium[_SimulationController.actSimStep] <= self.filters[i].max) &&
                ((d.NAct === "E" && self.filters[i].excitatory) || (d.NAct === "I" && self.filters[i].inhibitory))) {
              self.gNeuronsFilterB[z] = false;
            }
            //Excitatory conections filter
            else if (self.filters[i].type === "EConn" &&
                     !(_SimulationData.gNeuronsDetails[d.NId].DeSeEA[_SimulationController.actSimStep] >= self.filters[i].min &&
                     _SimulationData.gNeuronsDetails[d.NId].DeSeEA[_SimulationController.actSimStep] <= self.filters[i].max) &&
                     ((d.NAct === "E" && self.filters[i].excitatory) ||
                      (d.NAct === "I" && self.filters[i].inhibitory))) {
              self.gNeuronsFilterB[z] = false;
            }
            //Inhibitory conections filter
            else if (self.filters[i].type === "IConn" &&
                     !(_SimulationData.gNeuronsDetails[d.NId].DeSeIA[_SimulationController.actSimStep] >= self.filters[i].min &&
                     _SimulationData.gNeuronsDetails[d.NId].DeSeIA[_SimulationController.actSimStep] <= self.filters[i].max) &&
                     ((d.NAct === "E" && self.filters[i].excitatory) ||
                      (d.NAct === "I" && self.filters[i].inhibitory))) {
              self.gNeuronsFilterB[z] = false;
            }
            //Axonal conections filter
            else if (self.filters[i].type === "AConn" &&
                     !(_SimulationData.gNeuronsDetails[d.NId].AxSeA[_SimulationController.actSimStep] >= self.filters[i].min &&
                     _SimulationData.gNeuronsDetails[d.NId].AxSeA[_SimulationController.actSimStep] <= self.filters[i].max) &&
                     ((d.NAct === "E" && self.filters[i].excitatory) ||
                      (d.NAct === "I" && self.filters[i].inhibitory))) {
              self.gNeuronsFilterB[z] = false;
            }
          }
        });
    }
    else {
      this.gNeuronsFilterB = [];
      var size = _SimulationData.gNeurons.length;
      while (size--) {
        this.gNeuronsFilterB[size] = true;
        this.gNeuronsFilter[size] = size;
      }
    }

    if (this.order !== "none") {
      this.orderIndex = new Array(_SimulationData.gNeurons.length);
      var lIndex = _SimulationController.actSimStep % _SimulationData.numSimStepsPerFile;
      var orderValues = [];

      if (this.order === "calcium") {
        _SimulationData.gNeuronsDetails.forEach(function (d, i) {
          orderValues.push([d.Calcium[lIndex], i]);
        });
      }
      else if (this.order === "econn") {
        _SimulationData.gNeuronsDetails.forEach(function (d, i) {
          orderValues.push([d.DeSeEA[lIndex], i]);
        });
      }
      else if (this.order === "iconn") {
        _SimulationData.gNeuronsDetails.forEach(function (d, i) {
          orderValues.push([d.DeSeIA[lIndex], i]);
        });
      }
      else if (this.order === "aconn") {
        _SimulationData.gNeuronsDetails.forEach(function (d, i) {
          orderValues.push([d.AxSeA[lIndex], i]);
        });
      }

      orderValues.sort(function (c1, c2) {
        if (self.inverseOrder)
          return c1[0] > c2[0] ? -1 : 1;
        else
          return c1[0] < c2[0] ? -1 : 1;
      });

      if (this.orderMix) {
        orderValues.forEach(function (d, i) {
          _SimulationData.gNeurons[d[1]].index = i;
          self.orderIndex[i] = d[1];
        });
      } else {
        var eIndex = 0;
        var iIndex = this.excitatoryNum;
        orderValues.forEach(function (d, i) {
          if (_SimulationData.gNeurons[d[1]].NAct === "E") {
            _SimulationData.gNeurons[d[1]].index = eIndex;
            self.orderIndex[eIndex] = d[1];
            eIndex += 1;
          }
          else {
            _SimulationData.gNeurons[d[1]].index = iIndex;
            self.orderIndex[iIndex] = d[1];
            iIndex += 1;
          }
        });
      }

    }
    else {
      self.orderIndex = new Array(_SimulationData.gNeurons.length);
      _SimulationData.gNeurons.forEach(function (d, i) {
        d.index = i;
        self.orderIndex[i] = i;
      });
    }
  }
};

