// AUTOGENERATED FILE
#pragma once

#include <string_view>

#include "barretenberg/relations/relation_parameters.hpp"
#include "barretenberg/relations/relation_types.hpp"

namespace bb::avm {

template <typename FF_> class keccakf1600Impl {
  public:
    using FF = FF_;

    static constexpr std::array<size_t, 1> SUBRELATION_PARTIAL_LENGTHS = { 3 };

    template <typename ContainerOverSubrelations, typename AllEntities>
    void static accumulate(ContainerOverSubrelations& evals,
                           const AllEntities& new_term,
                           [[maybe_unused]] const RelationParameters<FF>&,
                           [[maybe_unused]] const FF& scaling_factor)
    {

        {
            using Accumulator = typename std::tuple_element_t<0, ContainerOverSubrelations>;
            auto tmp = (new_term.keccakf1600_sel_keccakf1600 * (FF(1) - new_term.keccakf1600_sel_keccakf1600));
            tmp *= scaling_factor;
            std::get<0>(evals) += typename Accumulator::View(tmp);
        }
    }
};

template <typename FF> class keccakf1600 : public Relation<keccakf1600Impl<FF>> {
  public:
    static constexpr const std::string_view NAME = "keccakf1600";

    static std::string get_subrelation_label(size_t index)
    {
        switch (index) {}
        return std::to_string(index);
    }
};

} // namespace bb::avm